// Pure monitoring calculations. No database access or mutation: the current
// rubrics, group membership and judge assignments define the required sheets.
const idOf = (value) => String(value?._id ?? value ?? '');
const round = (value) => Number(value.toFixed(4));
const percentage = (done, total) => total > 0 ? Number((done / total * 100).toFixed(1)) : 0;
const keyOf = (judgeId, categoryId, contestantId) => `${idOf(judgeId)}:${idOf(categoryId)}:${idOf(contestantId)}`;

const timestampOf = (score) => {
  const date = score?.updatedAt ?? score?.createdAt;
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const latestTimestamp = (values) => values.filter(Boolean).sort().at(-1) ?? null;

const completionStatus = (scoredFields, requiredFields, hasSavedSheet = false) => {
  if (requiredFields === 0) return 'not_required';
  if (scoredFields === requiredFields) return 'complete';
  return scoredFields > 0 || hasSavedSheet ? 'in_progress' : 'not_started';
};

export const getAssignedJudges = (category, activeJudges) => {
  // null/absent keeps legacy behavior. An explicit [] intentionally assigns none.
  if (category.assignedJudges == null) return activeJudges;
  const assignedIds = new Set(category.assignedJudges.map(idOf));
  return activeJudges.filter((judge) => assignedIds.has(idOf(judge)));
};

export const evaluateScoreSheet = (rubrics = [], scoreDocument) => {
  const entriesByRubric = new Map();
  for (const entry of scoreDocument?.rubricsScore ?? []) {
    if (!entry) continue;
    const id = idOf(entry.rubricsId);
    const entries = entriesByRubric.get(id) ?? [];
    entries.push(entry);
    entriesByRubric.set(id, entries);
  }

  const fields = rubrics.map((rubric) => {
    const entries = entriesByRubric.get(idOf(rubric)) ?? [];
    const value = entries[0]?.score;
    // Explicit zero is scored. Missing, null, non-finite, out-of-range and
    // duplicate values must never make a sheet appear complete.
    const valid = entries.length === 1 && typeof value === 'number' &&
      Number.isFinite(value) && value >= 0 && value <= rubric.maxPoints;
    return {
      rubricsId: idOf(rubric),
      name: rubric.name,
      maxPoints: rubric.maxPoints,
      score: valid ? value : null,
      status: valid ? 'scored' : entries.length ? 'invalid' : 'missing',
    };
  });

  const scoredFields = fields.filter((field) => field.status === 'scored').length;
  return {
    status: completionStatus(scoredFields, fields.length, Boolean(scoreDocument)),
    scoredFields,
    requiredFields: fields.length,
    missingFields: fields.filter((field) => field.status === 'missing').length,
    invalidFields: fields.filter((field) => field.status === 'invalid').length,
    progressPercentage: percentage(scoredFields, fields.length),
    // Use the unrounded total for ranking; round only the response/display.
    totalScore: fields.reduce((sum, field) => sum + (field.score ?? 0), 0),
    lastUpdatedAt: timestampOf(scoreDocument),
    fields,
  };
};

export const buildScoringDashboard = ({
  configuration = null,
  categories = [],
  groups = [],
  contestants = [],
  judges = [],
  scores = [],
  now = new Date(),
} = {}) => {
  const activeJudges = judges.filter((judge) => judge.userType === 'Judge' && judge.isActive !== false);
  const activeContestants = contestants.filter((contestant) => contestant.isActive !== false);
  const groupsById = new Map(groups.map((group) => [idOf(group), group]));
  const scoresBySheet = new Map();

  for (const score of scores) {
    const key = keyOf(score.judgeId, score.categoryId, score.contestantId);
    const previous = scoresBySheet.get(key);
    // Defensive against legacy duplicates if the unique index was not built.
    if (!previous || (timestampOf(score) ?? '') >= (timestampOf(previous) ?? '')) {
      scoresBySheet.set(key, score);
    }
  }

  const categorySnapshots = categories.map((category) => {
    const categoryId = idOf(category);
    const rubrics = category.rubrics ?? [];
    const eligibleGroups = groups.filter((group) => (group.categoriesIncluded ?? []).some((id) => idOf(id) === categoryId));
    const groupIds = new Set(eligibleGroups.map(idOf));
    const eligibleContestants = activeContestants.filter((contestant) => groupIds.has(idOf(contestant.group)));
    const assignedJudges = getAssignedJudges(category, activeJudges);
    const sheetsByContestant = new Map(eligibleContestants.map((contestant) => [idOf(contestant), []]));

    const judgeSnapshots = assignedJudges.map((judge) => {
      const contestantSheets = eligibleContestants.map((contestant) => {
        const document = scoresBySheet.get(keyOf(judge._id, categoryId, contestant._id));
        const sheet = evaluateScoreSheet(rubrics, document);
        sheetsByContestant.get(idOf(contestant)).push(sheet);
        const group = groupsById.get(idOf(contestant.group));
        return {
          contestantId: idOf(contestant),
          name: contestant.name,
          label: contestant.label,
          groupId: idOf(contestant.group),
          groupName: group?.name ?? '',
          ...sheet,
          totalScore: round(sheet.totalScore),
        };
      });

      const requiredSheets = rubrics.length > 0 ? contestantSheets.length : 0;
      const completedSheets = contestantSheets.filter((sheet) => sheet.status === 'complete').length;
      const inProgressSheets = contestantSheets.filter((sheet) => sheet.status === 'in_progress').length;
      const notStartedSheets = contestantSheets.filter((sheet) => sheet.status === 'not_started').length;
      const scoredFields = contestantSheets.reduce((sum, sheet) => sum + sheet.scoredFields, 0);
      const requiredFields = requiredSheets * rubrics.length;

      return {
        judgeId: idOf(judge),
        judgeName: `${judge.firstName ?? ''} ${judge.lastName ?? ''}`.trim() || judge.username,
        username: judge.username,
        status: completionStatus(scoredFields, requiredFields, inProgressSheets > 0),
        totalContestants: eligibleContestants.length,
        requiredSheets,
        completedSheets,
        inProgressSheets,
        notStartedSheets,
        pendingEvaluations: requiredSheets - completedSheets,
        scoredFields,
        requiredFields,
        progressPercentage: percentage(scoredFields, requiredFields),
        lastUpdatedAt: latestTimestamp(contestantSheets.map((sheet) => sheet.lastUpdatedAt)),
        contestants: contestantSheets,
      };
    });

    const requiredSheets = judgeSnapshots.reduce((sum, judge) => sum + judge.requiredSheets, 0);
    const completedSheets = judgeSnapshots.reduce((sum, judge) => sum + judge.completedSheets, 0);
    const inProgressSheets = judgeSnapshots.reduce((sum, judge) => sum + judge.inProgressSheets, 0);
    const notStartedSheets = judgeSnapshots.reduce((sum, judge) => sum + judge.notStartedSheets, 0);
    const scoredFields = judgeSnapshots.reduce((sum, judge) => sum + judge.scoredFields, 0);
    const requiredFields = requiredSheets * rubrics.length;

    const rankingGroups = eligibleGroups.map((group) => {
      const rows = eligibleContestants.filter((contestant) => idOf(contestant.group) === idOf(group)).map((contestant) => {
        const sheets = sheetsByContestant.get(idOf(contestant));
        const submittedSheets = sheets.filter((sheet) => sheet.scoredFields > 0).length;
        const accumulatedScore = sheets.reduce((sum, sheet) => sum + sheet.totalScore, 0);
        // Match the existing rubric-total/average/weight formula, while
        // explicitly marking incomplete scores as provisional.
        const averageScore = submittedSheets > 0 ? accumulatedScore / submittedSheets : null;
        const rowScoredFields = sheets.reduce((sum, sheet) => sum + sheet.scoredFields, 0);
        const rowRequiredFields = assignedJudges.length * rubrics.length;

        return {
          contestantId: idOf(contestant),
          name: contestant.name,
          label: contestant.label,
          image: contestant.image ?? '',
          rank: null,
          accumulatedScore,
          averageScore,
          weightedScore: averageScore === null ? null : averageScore * category.weight / 100,
          submittedSheets,
          completedSheets: sheets.filter((sheet) => sheet.status === 'complete').length,
          assignedJudges: assignedJudges.length,
          scoredFields: rowScoredFields,
          requiredFields: rowRequiredFields,
          progressPercentage: percentage(rowScoredFields, rowRequiredFields),
          status: completionStatus(rowScoredFields, rowRequiredFields, sheets.some((sheet) => sheet.status === 'in_progress')),
          lastUpdatedAt: latestTimestamp(sheets.map((sheet) => sheet.lastUpdatedAt)),
        };
      });

      rows.sort((a, b) => {
        if (a.averageScore === null && b.averageScore !== null) return 1;
        if (b.averageScore === null && a.averageScore !== null) return -1;
        const difference = (b.averageScore ?? 0) - (a.averageScore ?? 0);
        if (Math.abs(difference) > 1e-9) return difference;
        return a.label.localeCompare(b.label, 'en', { numeric: true }) ||
          a.name.localeCompare(b.name, 'en') || a.contestantId.localeCompare(b.contestantId);
      });

      let previousAverage = null;
      let previousRank = null;
      const rankings = rows.map((row, index) => {
        const rank = row.averageScore === null ? null :
          previousAverage !== null && Math.abs(row.averageScore - previousAverage) <= 1e-9 ? previousRank : index + 1;
        previousAverage = row.averageScore;
        previousRank = rank;
        return {
          ...row,
          rank,
          accumulatedScore: round(row.accumulatedScore),
          averageScore: row.averageScore === null ? null : round(row.averageScore),
          weightedScore: row.weightedScore === null ? null : round(row.weightedScore),
        };
      });

      return { groupId: idOf(group), name: group.name, rankings };
    });

    return {
      categoryId,
      name: category.name,
      description: category.description ?? '',
      weight: category.weight,
      isActive: category.isActive !== false,
      assignedJudges: category.assignedJudges == null ? null : category.assignedJudges.map(idOf),
      assignmentMode: category.assignedJudges == null ? 'all_active' : 'specific',
      maxPoints: rubrics.reduce((sum, rubric) => sum + rubric.maxPoints, 0),
      rubrics: rubrics.map((rubric) => ({ rubricsId: idOf(rubric), name: rubric.name, maxPoints: rubric.maxPoints })),
      resultStatus: 'provisional',
      lastUpdatedAt: latestTimestamp(judgeSnapshots.map((judge) => judge.lastUpdatedAt)),
      summary: {
        totalContestants: eligibleContestants.length,
        totalAssignedJudges: assignedJudges.length,
        requiredSheets,
        completedSheets,
        inProgressSheets,
        notStartedSheets,
        pendingEvaluations: requiredSheets - completedSheets,
        scoredFields,
        requiredFields,
        progressPercentage: percentage(scoredFields, requiredFields),
        completedJudges: judgeSnapshots.filter((judge) => judge.status === 'complete').length,
        inProgressJudges: judgeSnapshots.filter((judge) => judge.status === 'in_progress').length,
        notStartedJudges: judgeSnapshots.filter((judge) => judge.status === 'not_started').length,
        status: requiredFields === 0 ? 'not_configured' : completionStatus(scoredFields, requiredFields, inProgressSheets > 0),
      },
      groups: rankingGroups,
      judges: judgeSnapshots,
    };
  });

  const stats = {
    totalJudges: activeJudges.length,
    totalContestants: activeContestants.length,
    totalCategories: categories.length,
    completedCategories: categorySnapshots.filter((category) => category.summary.status === 'complete').length,
    requiredSheets: 0,
    completedSheets: 0,
    pendingEvaluations: 0,
    scoredFields: 0,
    requiredFields: 0,
  };
  for (const category of categorySnapshots) {
    for (const field of ['requiredSheets', 'completedSheets', 'pendingEvaluations', 'scoredFields', 'requiredFields']) {
      stats[field] += category.summary[field];
    }
  }
  stats.progressPercentage = percentage(stats.scoredFields, stats.requiredFields);

  return {
    generatedAt: now.toISOString(),
    refreshIntervalMs: 3000,
    event: {
      eventTitle: configuration?.eventTitle ?? '2026 Mr & Ms CCS',
      isConfigurationMode: configuration?.isConfigurationMode ?? true,
      activeCategoryId: configuration?.liveStatus?.categoryActive ? idOf(configuration.liveStatus.categoryActive) : null,
    },
    stats,
    judges: activeJudges.map((judge) => ({
      judgeId: idOf(judge),
      judgeName: `${judge.firstName ?? ''} ${judge.lastName ?? ''}`.trim() || judge.username,
      username: judge.username,
    })),
    categories: categorySnapshots,
  };
};
