import { createHash } from 'node:crypto';

const idOf = (value) => String(value?._id ?? value ?? '');
const isoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const savedAt = (document) => isoDate(document?.updatedAt ?? document?.createdAt);

// Add the decimal representations of stored numbers without introducing
// binary floating-point artifacts (e.g. 0.1 + 0.2). No score is rounded.
const decimalParts = (value) => {
  const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e');
  const [integer, fraction = ''] = coefficient.split('.');
  let digits = BigInt(`${integer}${fraction}`);
  const scale = fraction.length - Number(exponent);
  if (scale < 0) digits *= 10n ** BigInt(-scale);
  return { digits, scale: Math.max(0, scale) };
};
export const sumRecordedScores = (values) => {
  if (!values.length) return null;
  const parts = values.map(decimalParts);
  const scale = Math.max(...parts.map((part) => part.scale));
  const total = parts.reduce((sum, part) => sum + part.digits * 10n ** BigInt(scale - part.scale), 0n);
  const negative = total < 0n;
  const digits = (negative ? -total : total).toString().padStart(scale + 1, '0');
  const decimal = scale > 0 ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
  return `${negative ? '-' : ''}${decimal}`.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

const recordedValue = (value) => {
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (value == null || ['number', 'string', 'boolean'].includes(typeof value)) return value ?? null;
  return JSON.stringify(value);
};

/**
 * One read-only snapshot = one judge + one category + one contestant group.
 * Historical/inactive members remain visible: this is a record, not a live
 * ranking. Values are never averaged, weighted, or combined across categories.
 */
export const buildJudgeCategoryReport = ({ configuration, judge, category, group, contestants = [], scores = [], now = new Date() }) => {
  const scope = { judgeId: idOf(judge), categoryId: idOf(category), groupId: idOf(group) };
  const members = contestants.filter((contestant) => idOf(contestant.group) === scope.groupId)
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { numeric: true }) ||
      a.name.localeCompare(b.name, 'en') || idOf(a).localeCompare(idOf(b)));
  const memberIds = new Set(members.map(idOf));
  // Defense in depth: even accidentally over-broad query results cannot mix
  // another judge, category, or group into this report.
  const scopedScores = scores.filter((score) => idOf(score.judgeId) === scope.judgeId &&
    idOf(score.categoryId) === scope.categoryId && memberIds.has(idOf(score.contestantId)));
  const documentsByContestant = new Map();
  for (const score of scopedScores) {
    const id = idOf(score.contestantId);
    const documents = documentsByContestant.get(id) ?? [];
    documents.push(score);
    documentsByContestant.set(id, documents);
  }
  for (const documents of documentsByContestant.values()) {
    documents.sort((a, b) => (savedAt(a) ?? '').localeCompare(savedAt(b) ?? '') || idOf(a).localeCompare(idOf(b)));
  }

  const criteria = (category.rubrics ?? []).map((rubric) => ({
    rubricsId: idOf(rubric), name: rubric.name, maxPoints: rubric.maxPoints, isCurrent: true,
  }));
  const currentIds = new Set(criteria.map((criterion) => criterion.rubricsId));
  const legacyIds = new Set();
  for (const documents of documentsByContestant.values()) {
    for (const entry of documents.at(-1)?.rubricsScore ?? []) {
      if (entry && !currentIds.has(idOf(entry.rubricsId))) legacyIds.add(idOf(entry.rubricsId));
    }
  }
  // Preserve stored entries even if a rubric was removed. Its original name
  // cannot be recovered from the existing model; don't invent it or drop it.
  for (const id of [...legacyIds].sort()) {
    criteria.push({ rubricsId: id, name: `Unrecognized criterion (${id || 'missing ID'})`, maxPoints: null, isCurrent: false });
  }

  const rows = members.map((contestant, index) => {
    const documents = documentsByContestant.get(idOf(contestant)) ?? [];
    const document = documents.at(-1);
    const entriesByCriterion = new Map();
    for (const entry of document?.rubricsScore ?? []) {
      if (!entry) continue;
      const id = idOf(entry.rubricsId);
      const entries = entriesByCriterion.get(id) ?? [];
      entries.push(entry);
      entriesByCriterion.set(id, entries);
    }
    const fields = criteria.map((criterion) => {
      const entries = entriesByCriterion.get(criterion.rubricsId) ?? [];
      const value = entries[0]?.score;
      const finite = typeof value === 'number' && Number.isFinite(value);
      const inRange = finite && value >= 0 && (!criterion.isCurrent || value <= criterion.maxPoints);
      const issue = entries.length === 0 ? null : entries.length > 1 ? 'duplicate_values' :
        !finite ? 'invalid_value' : !inRange ? 'out_of_range' : !criterion.isCurrent ? 'unknown_criterion' : null;
      return {
        rubricsId: criterion.rubricsId,
        // Keep a single numeric value exactly as saved, even if invalid for
        // the current rubric. Invalid/duplicate raw values remain inspectable.
        score: entries.length === 1 && finite ? value : null,
        recordedValues: entries.map((entry) => recordedValue(entry.score)),
        status: entries.length === 0 ? 'missing' : issue ? 'review' : 'scored',
        issue,
      };
    });
    const scoredFields = fields.filter((field, fieldIndex) => criteria[fieldIndex].isCurrent && field.status === 'scored').length;
    const requiredFields = (category.rubrics ?? []).length;
    const hasReview = documents.length > 1 || fields.some((field) => field.status === 'review');
    const recordedFields = fields.filter((field) => field.recordedValues.length > 0);
    const canTotal = recordedFields.every((field) => field.recordedValues.length === 1 && typeof field.score === 'number');
    const totalScore = canTotal ? sumRecordedScores(recordedFields.map((field) => field.score)) : null;
    const status = hasReview ? 'needs_review' : requiredFields > 0 && scoredFields === requiredFields ? 'complete' : document ? 'in_progress' : 'not_started';

    return {
      rowNumber: index + 1,
      contestantId: idOf(contestant), name: contestant.name, label: contestant.label,
      isActive: contestant.isActive !== false,
      scoreSheetId: document ? idOf(document) : null,
      lastSavedAt: savedAt(document),
      status, scoredFields, requiredFields,
      missingFields: fields.filter((field, fieldIndex) => criteria[fieldIndex].isCurrent && field.status === 'missing').length,
      reviewFields: fields.filter((field) => field.status === 'review').length,
      duplicateScoreSheets: Math.max(0, documents.length - 1),
      // Decimal string: no loss of precision, no fake zero for no submission.
      totalScore,
      fields,
    };
  });

  const summary = {
    totalContestants: rows.length,
    totalCriteria: (category.rubrics ?? []).length,
    completedContestants: rows.filter((row) => row.status === 'complete').length,
    inProgressContestants: rows.filter((row) => row.status === 'in_progress').length,
    unscoredContestants: rows.filter((row) => row.status === 'not_started').length,
    reviewContestants: rows.filter((row) => row.status === 'needs_review').length,
    scoredFields: rows.reduce((sum, row) => sum + row.scoredFields, 0),
    requiredFields: rows.length * (category.rubrics ?? []).length,
    missingFields: rows.reduce((sum, row) => sum + row.missingFields, 0),
    reviewFields: rows.reduce((sum, row) => sum + row.reviewFields, 0),
    legacyCriteria: legacyIds.size,
    recordedEntries: rows.reduce((sum, row) => sum + row.fields.reduce((count, field) => count + field.recordedValues.length, 0), 0),
  };
  summary.isComplete = rows.length > 0 && summary.completedContestants === rows.length;
  const reportStatus = summary.reviewContestants > 0 || summary.totalCriteria === 0 ? 'needs_review' :
    summary.recordedEntries === 0 ? 'no_scores' : summary.isComplete ? 'complete' : 'incomplete';
  const payload = {
    scope,
    header: {
      country: 'Republic of the Philippines',
      institution: 'Jose Rizal Memorial State University',
      college: 'College of Computing Studies',
      eventTitle: configuration?.eventTitle || '2026 Mr & Ms CCS',
      title: 'Judge Category Score Report',
    },
    judge: { judgeId: scope.judgeId, name: `${judge.firstName ?? ''} ${judge.lastName ?? ''}`.trim() || judge.username, username: judge.username, isActive: judge.isActive !== false },
    category: { categoryId: scope.categoryId, name: category.name, weight: category.weight, maxPoints: Number(sumRecordedScores((category.rubrics ?? []).map((rubric) => rubric.maxPoints)) ?? 0), isActive: category.isActive !== false },
    group: { groupId: scope.groupId, name: group.name, isCurrentlyLinked: (group.categoriesIncluded ?? []).some((id) => idOf(id) === scope.categoryId) },
    criteria, rows, summary,
    status: reportStatus,
    canPrint: summary.recordedEntries > 0,
    lastSavedAt: rows.map((row) => row.lastSavedAt).filter(Boolean).sort().at(-1) ?? null,
  };
  // A content reference is not a stored report ID or a digital signature.
  const snapshotHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return { ...payload, reference: `JCS-${snapshotHash.slice(0, 16).toUpperCase()}`, snapshotHash, generatedAt: now.toISOString() };
};
