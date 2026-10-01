import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { requireJudgeOrAdmin } from '../middleware/auth.js';
import { buildJudgeCategoryReport } from '../services/judgeReportService.js';
import { Category } from '../models/Category.js';
import { Contestant } from '../models/Contestant.js';
import { ContestantGroup } from '../models/ContestantGroup.js';
import { JudgeScore } from '../models/JudgeScore.js';
import { User } from '../models/User.js';
import { Configuration } from '../models/Configuration.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// ─── 8.1 GET /reports/voting-progress ───
router.get('/reports/voting-progress', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can view progress report', []);
    }

    const judges = await User.find({ userType: 'Judge', isActive: true }).select('-password');
    const totalCategories = await Category.countDocuments();
    const totalContestants = await Contestant.countDocuments();
    const totalPossible = totalCategories * totalContestants;

    const allJudges = await Promise.all(
      judges.map(async (judge) => {
        const completed = await JudgeScore.countDocuments({ judgeId: judge._id });
        const progressPercentage = totalPossible === 0 ? 0 : (completed / totalPossible) * 100;

        return {
          judgeId: judge._id,
          judgeName: `${judge.firstName} ${judge.lastName}`,
          progressPercentage: Number(progressPercentage.toFixed(1)),
        };
      }),
    );

    return sendSuccess(res, allJudges, 'Voting progress calculated successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating judge progress percentages', []);
  }
});

// ─── 8.2 GET /reports/final-rankings ───
router.get('/reports/final-rankings', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.query || {};

    if (!groupId || !String(groupId).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter provided', []);
    }

    const group = await ContestantGroup.findById(groupId);
    if (!group) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter provided', []);
    }

    const config = await Configuration.findOne();
    const contestants = await Contestant.find({ group: group._id });
    const categories = await Category.find();

    const rankings = await Promise.all(
      contestants.map(async (contestant) => {
        const categoryScores = await Promise.all(
          categories.map(async (category) => {
            const judgeEntries = await JudgeScore.find({
              categoryId: category._id,
              contestantId: contestant._id,
            });

            const rawScore = judgeEntries.length
              ? judgeEntries.reduce((sum, entry) => {
                  const rubricTotal = (entry.rubricsScore || []).reduce(
                    (total, item) => total + Number(item.score || 0),
                    0,
                  );
                  return sum + rubricTotal;
                }, 0) / judgeEntries.length
              : 0;

            const weightedScore = (rawScore * category.weight) / 100;

            return {
              categoryName: category.name,
              rawScore: Number(rawScore.toFixed(1)),
              weight: category.weight,
              weightedScore: Number(weightedScore.toFixed(1)),
            };
          }),
        );

        const finalCandidateScore = categoryScores.reduce((sum, item) => sum + item.weightedScore, 0);

        return {
          contestantId: contestant._id,
          name: contestant.name,
          label: contestant.label,
          categoryScores,
          final_candidate_score: Number(finalCandidateScore.toFixed(1)),
        };
      }),
    );

    rankings.sort((a, b) => b.final_candidate_score - a.final_candidate_score);
    const ranked = rankings.map((entry, index) => ({ rank: index + 1, ...entry }));

    return sendSuccess(
      res,
      {
        eventTitle: config?.eventTitle || '',
        group: group.name,
        rankings: ranked,
      },
      'Final rankings calculated successfully',
      200,
    );
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter provided', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final rankings', []);
  }
});

// ─── 8.3 Legacy combined paper export ───
// Final standings remain available as analytics via /reports/final-rankings.
// An official judge score report must never blend judges or categories.
router.get('/reports/paper/final-ranking-sheet', authenticateToken, (req, res) => {
  return sendError(res, 410, 'REPORT_REPLACED',
    'Combined paper reports are no longer available. Select one judge, one category and one contestant group for a judge score report',
    [{ replacement: '/reports/paper/judge-scoresheet/:judgeId', requiredQuery: ['categoryId', 'groupId'] }]);
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
