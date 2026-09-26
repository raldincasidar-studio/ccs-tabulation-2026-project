import express from 'express';
import { authenticateToken } from './authRoutes.js';
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

// ─── 8.3 GET /reports/paper/final-ranking-sheet ───
router.get('/reports/paper/final-ranking-sheet', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.query || {};

    if (!groupId || !String(groupId).trim()) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }

    const group = await ContestantGroup.findById(groupId);
    if (!group) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }

    const contestants = await Contestant.find({ group: group._id });
    const categories = await Category.find();

    const contestantScores = await Promise.all(
      contestants.map(async (contestant) => {
        let finalScore = 0;

        for (const category of categories) {
          const judgeEntries = await JudgeScore.find({
            categoryId: category._id,
            contestantId: contestant._id,
          });

          if (!judgeEntries.length) continue;

          const rawScore =
            judgeEntries.reduce((sum, entry) => {
              const rubricTotal = (entry.rubricsScore || []).reduce(
                (total, item) => total + Number(item.score || 0),
                0,
              );
              return sum + rubricTotal;
            }, 0) / judgeEntries.length;

          finalScore += (rawScore * category.weight) / 100;
        }

        return {
          rank: 1,
          nameAndLabel: `${contestant.label} - ${contestant.name}`,
          group: group.name,
          final_candidate_score: Number(finalScore.toFixed(1)),
        };
      }),
    );

    contestantScores.sort((a, b) => b.final_candidate_score - a.final_candidate_score);
    const ranked = contestantScores.map((row, index) => ({ ...row, rank: index + 1 }));

    if (!ranked.length) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }

    return sendSuccess(
      res,
      {
        header: {
          institution: 'Jose Rizal Memorial State University',
          college: 'College of Computing Studies',
          title: 'Mr. & Ms. CCS 2026 Final Ranking',
        },
        group: group.name,
        rows: ranked,
      },
      'Final ranking sheet prepared successfully',
      200,
    );
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final ranking sheet', []);
  }
});

// ─── 8.4 GET /reports/paper/judge-scoresheet/:judgeId ───
router.get('/reports/paper/judge-scoresheet/:judgeId', authenticateToken, async (req, res) => {
  try {
    const { judgeId } = req.params;

    const judge = await User.findOne({ _id: judgeId, userType: 'Judge' });
    if (!judge) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${judgeId}' has no submitted scores`, []);
    }

    const judgeEntries = await JudgeScore.find({ judgeId });
    if (!judgeEntries.length) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${judgeId}' has no submitted scores`, []);
    }

    const allContestants = await Contestant.find();
    const allCategories = await Category.find();

    const contestants = allContestants.map((contestant) => {
      const categories = allCategories.map((category) => {
        const scoreEntry = judgeEntries.find(
          (entry) =>
            entry.categoryId.toString() === category._id.toString() &&
            entry.contestantId.toString() === contestant._id.toString(),
        );
        const categoryScore = (scoreEntry?.rubricsScore || []).reduce(
          (sum, item) => sum + Number(item.score || 0),
          0,
        );
        return {
          categoryName: `${category.name} (${category.weight}%)`,
          score: categoryScore,
        };
      });

      return {
        rank: 1,
        nameAndLabel: `${contestant.label} - ${contestant.name}`,
        categoryBreakdown: categories,
        final_candidate_score: categories.reduce((sum, item) => sum + item.score, 0),
      };
    });

    contestants.sort((a, b) => b.final_candidate_score - a.final_candidate_score);
    const ranked = contestants.map((item, index) => ({ ...item, rank: index + 1 }));

    return sendSuccess(
      res,
      {
        header: {
          institution: 'Jose Rizal Memorial State University',
          college: 'College of Computing Studies',
          title: `MR & MS CCS 2026 ${judge.firstName} ${judge.lastName} Scoresheet`,
        },
        judgeName: `${judge.firstName} ${judge.lastName}`,
        contestants: ranked,
      },
      'Judge scoresheet retrieved successfully',
      200,
    );
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID has no submitted scores`, []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error generating judge scoresheet', []);
  }
});

export default router;
