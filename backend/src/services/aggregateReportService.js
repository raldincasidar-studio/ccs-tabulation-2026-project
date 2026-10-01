import { buildScoringDashboard, evaluateScoreSheet, getAssignedJudges } from './dashboardService.js';
import { buildJudgeCategoryReport, sumRecordedScores } from './judgeReportService.js';

const idOf = (value) => String(value?._id ?? value ?? '');
const judgeName = (judge) => `${judge.firstName ?? ''} ${judge.lastName ?? ''}`.trim() || judge.username;
const header = (title) => ({
  institution: 'Jose Rizal Memorial State University',
  college: 'College of Computing Studies',
  title,
});
const displayOrder = (a, b) => String(a.label ?? '').localeCompare(String(b.label ?? ''), 'en', { numeric: true }) ||
  String(a.name ?? '').localeCompare(String(b.name ?? ''), 'en') || a.contestantId.localeCompare(b.contestantId);

// Shared competition ranks are provisional, not an invented official tie-break.
const rankRows = (rows, valueOf) => {
  rows.sort((a, b) => {
    const left = valueOf(a);
    const right = valueOf(b);
    if (left === null && right !== null) return 1;
    if (right === null && left !== null) return -1;
    const difference = (right ?? 0) - (left ?? 0);
    return Math.abs(difference) > 1e-9 ? difference : displayOrder(a, b);
  });
  let previous = null;
  let previousRank = null;
  return rows.map((row, index) => {
    const value = valueOf(row);
    const rank = value === null ? null : previous !== null && Math.abs(value - previous) <= 1e-9 ? previousRank : index + 1;
    previous = value;
    previousRank = rank;
    return { ...row, rank };
  });
};

export const buildVotingProgressReport = (data) => {
  const snapshot = buildScoringDashboard(data);
  return snapshot.judges.map((judge) => {
    const records = snapshot.categories.flatMap((category) => category.judges.filter((item) => item.judgeId === judge.judgeId));
    const total = (key) => records.reduce((sum, item) => sum + item[key], 0);
    const requiredFields = total('requiredFields');
    const scoredFields = total('scoredFields');
    return {
      ...judge,
      requiredFields,
      scoredFields,
      requiredSheets: total('requiredSheets'),
      completedSheets: total('completedSheets'),
      pendingEvaluations: total('pendingEvaluations'),
      progressPercentage: requiredFields ? Number((scoredFields / requiredFields * 100).toFixed(1)) : 0,
      status: !requiredFields ? 'not_required' : scoredFields === requiredFields ? 'complete' :
        records.some((item) => item.status === 'in_progress' || item.scoredFields > 0) ? 'in_progress' : 'not_started',
    };
  });
};

// Preserve the existing overall formula: SUM(category average raw * weight / 100).
// This is intentionally NOT the raw-sum weighting on a single-category matrix.
export const buildOverallRankingReport = (data) => {
  const { group, configuration, contestants = [], now = new Date() } = data;
  const snapshot = buildScoringDashboard({ ...data, groups: [group], now });
  const categories = snapshot.categories.filter((category) => category.groups.some((item) => item.groupId === idOf(group)));
  const rows = contestants.filter((contestant) => idOf(contestant.group) === idOf(group) && contestant.isActive !== false).map((contestant) => {
    const categoryScores = categories.map((category) => {
      const row = category.groups.find((item) => item.groupId === idOf(group))?.rankings.find((item) => item.contestantId === idOf(contestant));
      return {
        categoryId: category.categoryId,
        categoryName: category.name,
        rawScore: row?.averageScore == null ? null : Number(row.averageScore.toFixed(1)),
        weight: category.weight,
        weightedScore: row?.averageScore == null ? null : Number((row.averageScore * category.weight / 100).toFixed(1)),
        status: row?.status ?? 'not_started',
      };
    });
    const hasScores = categoryScores.some((category) => category.weightedScore !== null);
    return {
      contestantId: idOf(contestant), name: contestant.name, label: contestant.label,
      nameAndLabel: `${contestant.label} - ${contestant.name}`, group: group.name,
      categoryScores,
      final_candidate_score: hasScores ? Number(categoryScores.reduce((sum, item) => sum + (item.weightedScore ?? 0), 0).toFixed(1)) : null,
      status: categoryScores.length && categoryScores.every((category) => category.status === 'complete') ? 'complete' : hasScores ? 'in_progress' : 'not_started',
    };
  });
  const rankings = rankRows(rows, (row) => row.final_candidate_score);
  const panelIds = new Set(categories.flatMap((category) => category.judges.map((judge) => judge.judgeId)));
  return {
    header: header('Mr. & Ms. CCS 2026 Final Ranking'),
    eventTitle: configuration?.eventTitle || 'MR. AND MS. CCS 2026',
    scope: { groupId: idOf(group) }, group: group.name,
    generatedAt: now.toISOString(), resultStatus: 'provisional',
    formula: 'Overall weighted points = sum of each category average raw score × category weight / 100.',
    judges: snapshot.judges.filter((judge) => panelIds.has(judge.judgeId)),
    categories: categories.map((category) => ({ categoryId: category.categoryId, name: category.name, weight: category.weight })),
    canPrint: rankings.some((row) => row.final_candidate_score !== null),
    rankings, rows: rankings,
  };
};

export const buildCategoryResultsReport = ({ configuration, group, category, contestants = [], judges = [], scores = [], now = new Date() }) => {
  const groupId = idOf(group);
  const categoryId = idOf(category);
  const assigned = getAssignedJudges(category, judges.filter((judge) => judge.userType === 'Judge' && judge.isActive !== false));
  const isLinked = (group.categoriesIncluded ?? []).some((id) => idOf(id) === categoryId);
  const members = isLinked ? contestants.filter((contestant) => idOf(contestant.group) === groupId && contestant.isActive !== false) : [];
  const memberIds = new Set(members.map(idOf));
  const assignedIds = new Set(assigned.map(idOf));
  const documents = new Map();
  const duplicateSheets = new Set();
  const currentRubrics = new Set((category.rubrics ?? []).map(idOf));
  const timestamp = (item) => new Date(item?.updatedAt ?? item?.createdAt ?? 0).getTime() || 0;
  for (const score of scores) {
    if (idOf(score.categoryId) !== categoryId || !assignedIds.has(idOf(score.judgeId)) || !memberIds.has(idOf(score.contestantId))) continue;
    const key = `${idOf(score.judgeId)}:${idOf(score.contestantId)}`;
    const previous = documents.get(key);
    if (previous) duplicateSheets.add(key);
    if (!previous || timestamp(score) > timestamp(previous) || timestamp(score) === timestamp(previous) && idOf(score) > idOf(previous)) documents.set(key, score);
  }
  const rows = members.map((contestant) => {
    const judgeTotals = assigned.map((judge) => {
      const key = `${idOf(judge)}:${idOf(contestant)}`;
      const document = documents.get(key);
      const sheet = evaluateScoreSheet(category.rubrics, document);
      const needsReview = duplicateSheets.has(key) || sheet.invalidFields > 0 ||
        (document?.rubricsScore ?? []).some((entry) => !currentRubrics.has(idOf(entry?.rubricsId)));
      return {
        judgeId: idOf(judge),
        totalRaw: sheet.scoredFields ? Number(sumRecordedScores(sheet.fields.filter((field) => field.status === 'scored').map((field) => field.score))) : null,
        status: needsReview ? 'needs_review' : sheet.status,
        scoredFields: sheet.scoredFields, requiredFields: sheet.requiredFields,
      };
    });
    const submitted = judgeTotals.filter((item) => item.totalRaw !== null);
    const totalRaw = submitted.length ? Number(sumRecordedScores(submitted.map((item) => item.totalRaw))) : null;
    return {
      contestantId: idOf(contestant), name: contestant.name, label: contestant.label,
      judgeTotals, totalRaw,
      averageRaw: totalRaw === null ? null : totalRaw / submitted.length,
      // The sample explicitly uses total raw, not the average, for this column.
      weightedTotal: totalRaw === null ? null : totalRaw * category.weight / 100,
      submittedJudges: submitted.length,
      status: judgeTotals.some((item) => item.status === 'needs_review') ? 'needs_review' :
        judgeTotals.length && judgeTotals.every((item) => item.status === 'complete') ? 'complete' : submitted.length ? 'in_progress' : 'not_started',
    };
  });
  return {
    header: header('Final Category Results'), eventTitle: configuration?.eventTitle || 'MR. AND MS. CCS 2026',
    scope: { groupId, categoryId }, group: { groupId, name: group.name },
    category: { categoryId, name: category.name, weight: category.weight },
    generatedAt: now.toISOString(), resultStatus: 'provisional',
    scoringComplete: rows.length > 0 && rows.every((row) => row.status === 'complete'),
    canPrint: rows.some((row) => row.totalRaw !== null),
    judges: assigned.map((judge, index) => ({ judgeId: idOf(judge), judgeName: judgeName(judge), label: `Judge ${index + 1}` })),
    formula: `Weighted total = Total raw × ${category.weight} / 100. Average raw = Total raw / judges with at least one valid saved field.`,
    tiePolicy: 'Equal weighted totals share a provisional rank. No official tie-break or finalization rule is configured.',
    rows: rankRows(rows, (row) => row.weightedTotal),
  };
};

// The restored multi-category summary is a separate format/API, not a weakened
// version of the strict individual judge/category criterion record.
export const buildJudgeSummaryReport = ({ configuration, judge, group, categories = [], contestants = [], scores = [], now = new Date() }) => {
  const linked = new Set((group.categoriesIncluded ?? []).map(idOf));
  const summaries = categories.filter((category) => linked.has(idOf(category))).map((category) => ({
    category,
    report: buildJudgeCategoryReport({ configuration, judge, category, group, contestants, scores, now }),
  }));
  const rows = contestants.filter((contestant) => idOf(contestant.group) === idOf(group)).map((contestant) => {
    const categoryBreakdown = summaries.map(({ category, report }) => {
      const row = report.rows.find((item) => item.contestantId === idOf(contestant));
      return { categoryId: idOf(category), categoryName: `${category.name} (${category.weight}%)`, score: row?.totalScore ?? null, status: row?.status ?? 'not_started' };
    });
    const totals = categoryBreakdown.filter((item) => item.score !== null).map((item) => Number(item.score));
    return {
      contestantId: idOf(contestant), name: contestant.name, label: contestant.label,
      nameAndLabel: `${contestant.label} - ${contestant.name}`, categoryBreakdown,
      final_candidate_score: totals.length ? Number(sumRecordedScores(totals)) : null,
      status: categoryBreakdown.length && categoryBreakdown.every((item) => item.status === 'complete') ? 'complete' :
        categoryBreakdown.some((item) => item.status === 'needs_review') ? 'needs_review' : totals.length ? 'incomplete' : 'no_scores',
    };
  });
  return {
    header: header(`${configuration?.eventTitle || 'MR & MS CCS 2026'} Judge Category Summary`),
    scope: { judgeId: idOf(judge), groupId: idOf(group) },
    judgeId: idOf(judge), judgeName: judgeName(judge), group: group.name,
    generatedAt: now.toISOString(), resultStatus: 'provisional',
    canPrint: summaries.some(({ report }) => report.canPrint),
    contestants: rankRows(rows, (row) => row.final_candidate_score),
  };
};
