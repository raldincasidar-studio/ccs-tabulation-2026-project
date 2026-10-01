import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { requireAdmin, requireJudgeOrAdmin } from '../middleware/auth.js';
import { buildJudgeCategoryReport } from '../services/judgeReportService.js';
import { buildCategoryResultsReport, buildJudgeSummaryReport, buildOverallRankingReport, buildVotingProgressReport } from '../services/aggregateReportService.js';
import { Category, Contestant, ContestantGroup, JudgeScore, User, Configuration } from '../models/index.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();
const validId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

// Bulk, current-eligibility data for aggregate standings and progress only.
// Historical individual/summary records use their own explicitly scoped reads.
async function loadAggregateData({ group = null, category = null } = {}) {
  const [configuration, categories, groups, contestants, judges] = await Promise.all([
    Configuration.findOne().select('eventTitle').lean(),
    category ? [category] : Category.find(group ? { _id: { $in: group.categoriesIncluded ?? [] } } : {})
      .select('name weight rubrics assignedJudges isActive').sort({ createdAt: 1, _id: 1 }).lean(),
    group ? [group] : ContestantGroup.find().select('name categoriesIncluded').lean(),
    Contestant.find({ isActive: { $ne: false }, ...(group ? { group: group._id } : {}) })
      .select('name label group isActive').lean(),
    User.find({ userType: 'Judge', isActive: true }).select('username firstName lastName userType isActive')
      .sort({ createdAt: 1, _id: 1 }).lean(),
  ]);
  const scores = await JudgeScore.find({
    categoryId: { $in: categories.map((item) => item._id) },
    contestantId: { $in: contestants.map((item) => item._id) },
    judgeId: { $in: judges.map((item) => item._id) },
  }).select('judgeId categoryId contestantId rubricsScore createdAt updatedAt').lean();
  return { configuration, categories, groups, contestants, judges, scores, group, category };
}

// ─── 8.1 GET /reports/voting-progress (restored screen/paper) ───
router.get('/reports/voting-progress', authenticateToken, requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const { groupId } = req.query;
    if (groupId !== undefined && !validId(groupId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'groupId must be one valid contestant group ID', []);
    }
    const group = groupId ? await ContestantGroup.findById(groupId).select('name categoriesIncluded').lean() : null;
    if (groupId && !group) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    return sendSuccess(res, buildVotingProgressReport(await loadAggregateData({ group })), 'Voting progress calculated successfully');
  } catch {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating judge progress percentages', []);
  }
});

// ─── 8.2 GET /reports/final-rankings ───
router.get('/reports/final-rankings', authenticateToken, requireJudgeOrAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    if (!validId(req.query.groupId)) return sendError(res, 400, 'VALIDATION_ERROR', 'One valid groupId is required', []);
    const group = await ContestantGroup.findById(req.query.groupId).select('name categoriesIncluded').lean();
    if (!group) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    return sendSuccess(res, buildOverallRankingReport(await loadAggregateData({ group })), 'Final rankings calculated successfully');
  } catch {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final rankings', []);
  }
});

// ─── 8.3 Restored overall paper endpoint; no longer returns 410 ───
router.get('/reports/paper/final-ranking-sheet', authenticateToken, requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    if (!validId(req.query.groupId)) return sendError(res, 400, 'VALIDATION_ERROR', 'Select one contestant group before preparing the overall ranking sheet', []);
    const group = await ContestantGroup.findById(req.query.groupId).select('name categoriesIncluded').lean();
    if (!group) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    return sendSuccess(res, buildOverallRankingReport(await loadAggregateData({ group })), 'Final ranking sheet prepared successfully');
  } catch {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final ranking sheet', []);
  }
});

// Aggregate category matrix matching the supplied final-results paper sample.
router.get('/reports/paper/category-results', authenticateToken, requireAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const { categoryId, groupId } = req.query;
    if (![categoryId, groupId].every(validId)) return sendError(res, 400, 'VALIDATION_ERROR', 'One valid categoryId and groupId are required', []);
    const [group, category] = await Promise.all([
      ContestantGroup.findById(groupId).select('name categoriesIncluded').lean(),
      Category.findById(categoryId).select('name weight rubrics assignedJudges isActive').lean(),
    ]);
    if (!group || !category) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Category or contestant group not found', []);
    if (!(group.categoriesIncluded ?? []).some((id) => id.toString() === categoryId.toLowerCase())) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'This category is not included in the selected contestant group', []);
    }
    return sendSuccess(res, buildCategoryResultsReport(await loadAggregateData({ group, category })), 'Category results sheet prepared successfully');
  } catch {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error preparing category results sheet', []);
  }
});

// Restored full/category-total judge summaries use a DISTINCT endpoint.
// Do not make omitted categoryId a back door into the strict criterion report.
router.get('/reports/paper/judge-summary/:judgeId', authenticateToken, requireJudgeOrAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const { judgeId } = req.params;
    const { groupId } = req.query;
    if (![judgeId, groupId].every(validId)) return sendError(res, 400, 'VALIDATION_ERROR', 'One valid judgeId and groupId are required for a judge summary', []);
    if (req.user.userType === 'Judge' && req.user._id.toString() !== judgeId.toLowerCase()) {
      return sendError(res, 403, 'FORBIDDEN', 'Judges can only view their own score reports', []);
    }
    const [judge, group, configuration] = await Promise.all([
      User.findOne({ _id: judgeId, userType: 'Judge' }).select('username firstName lastName isActive').lean(),
      ContestantGroup.findById(groupId).select('name categoriesIncluded').lean(),
      Configuration.findOne().select('eventTitle').lean(),
    ]);
    if (!judge || !group) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Judge or contestant group not found', []);
    const [categories, contestants] = await Promise.all([
      Category.find({ _id: { $in: group.categoriesIncluded ?? [] } }).select('name weight rubrics isActive').sort({ createdAt: 1, _id: 1 }).lean(),
      Contestant.find({ group: group._id }).select('name label group isActive').lean(),
    ]);
    const scores = await JudgeScore.find({
      judgeId: judge._id, categoryId: { $in: categories.map((category) => category._id) },
      contestantId: { $in: contestants.map((contestant) => contestant._id) },
    }).select('judgeId categoryId contestantId rubricsScore createdAt updatedAt').lean();
    return sendSuccess(res, buildJudgeSummaryReport({ configuration, judge, group, categories, contestants, scores }), 'Judge category summary prepared successfully');
  } catch {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error preparing judge category summary', []);
  }
});

// ─── 8.4 GET /reports/paper/judge-scoresheet/:judgeId ───
// Scope is enforced in database queries, not by trimming a combined report in
// the browser. Admins can retrieve any Judge's report; Judges only their own.
router.get('/reports/paper/judge-scoresheet/:judgeId', authenticateToken, requireJudgeOrAdmin, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const { judgeId } = req.params;
    const { categoryId, groupId } = req.query;
    if (![judgeId, categoryId, groupId].every((id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id))) {
      return sendError(res, 400, 'VALIDATION_ERROR',
        'A valid judgeId, categoryId and groupId are required. A report cannot combine judges, categories or groups',
        [{ field: 'scope', issue: 'Select exactly one judge, one category and one contestant group' }]);
    }
    if (req.user.userType === 'Judge' && req.user._id.toString() !== judgeId.toLowerCase()) {
      return sendError(res, 403, 'FORBIDDEN', 'Judges can only view their own score reports', []);
    }

    const [judge, category, group, configuration] = await Promise.all([
      User.findOne({ _id: judgeId, userType: 'Judge' }).select('username firstName lastName isActive').lean(),
      Category.findById(categoryId).select('name weight rubrics isActive').lean(),
      ContestantGroup.findById(groupId).select('name categoriesIncluded').lean(),
      Configuration.findOne().select('eventTitle').lean(),
    ]);
    if (!judge) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Judge not found', []);
    if (!category) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Category not found', []);
    if (!group) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);

    // Include inactive candidates/judges in historical records. Do not use
    // active-only live-ranking eligibility to erase previously entered scores.
    const contestants = await Contestant.find({ group: group._id }).select('name label group isActive').lean();
    const scores = await JudgeScore.find({
      judgeId: judge._id,
      categoryId: category._id,
      contestantId: { $in: contestants.map((contestant) => contestant._id) },
    }).select('judgeId categoryId contestantId rubricsScore createdAt updatedAt').lean();

    const isLinked = (group.categoriesIncluded ?? []).some((id) => id.toString() === category._id.toString());
    if (!isLinked && scores.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'The selected group does not include this category and has no historical scores for this judge/category scope', []);
    }
    return sendSuccess(res, buildJudgeCategoryReport({ configuration, judge, category, group, contestants, scores }),
      'Judge category score report retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error generating judge category score report', []);
  }
});

export default router;
