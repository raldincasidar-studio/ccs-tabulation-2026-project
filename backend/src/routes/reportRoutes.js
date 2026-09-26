import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { mockCategories, mockContestants, mockContestantGroups, mockJudgeScores, mockJudges, mockConfiguration } from '../mock/mockData.js';

const router = express.Router();

const getGroupById = (groupId) => mockContestantGroups.find((group) => group._id === groupId) || null;

// const getCategoryById = (categoryId) => mockCategories.find((category) => category._id === categoryId) || null;

// const getContestantById = (contestantId) => mockContestants.find((contestant) => contestant._id === contestantId) || null;

const getJudgeById = (judgeId) => mockJudges.find((judge) => judge._id === judgeId) || null;

router.get('/reports/voting-progress', authenticateToken, (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can view progress report');
    }

    const allJudges = mockJudges.map((judge) => {
      const judgeScores = mockJudgeScores.filter((entry) => entry.judgeId === judge._id);
      const totalPossible = mockCategories.length * mockContestants.length;
      const completed = new Set(judgeScores.map((entry) => `${entry.categoryId}:${entry.contestantId}`)).size;
      const progressPercentage = totalPossible === 0 ? 0 : (completed / totalPossible) * 100;

      return {
        judgeId: judge._id,
        judgeName: `${judge.firstName} ${judge.lastName}`,
        progressPercentage: Number(progressPercentage.toFixed(1)),
      };
    });

    return sendSuccess(res, allJudges, 'Voting progress calculated successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating judge progress percentages', []);
  }
});

router.get('/reports/final-rankings', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.query || {};
    if (!groupId || !String(groupId).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter provided', []);
    }

    const group = getGroupById(String(groupId));
    if (!group) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter provided', []);
    }

    const contestantsInGroup = mockContestants.filter((contestant) => contestant.group === group._id);
    const rankings = contestantsInGroup.map((contestant) => {
      const categoryScores = mockCategories.map((category) => {
        const judgeEntries = mockJudgeScores.filter((entry) => entry.categoryId === category._id && entry.contestantId === contestant._id);
        const rawScore = judgeEntries.length
          ? judgeEntries.reduce((sum, entry) => {
              const rubricTotal = (entry.rubricsScore || []).reduce((total, item) => total + Number(item.score || 0), 0);
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
      });

      const finalCandidateScore = categoryScores.reduce((sum, item) => sum + item.weightedScore, 0);
      return {
        contestantId: contestant._id,
        name: contestant.name,
        label: contestant.label,
        categoryScores,
        final_candidate_score: Number(finalCandidateScore.toFixed(1)),
      };
    }).sort((a, b) => b.final_candidate_score - a.final_candidate_score);

    const ranked = rankings.map((entry, index) => ({ rank: index + 1, ...entry }));

    return sendSuccess(
      res,
      {
        eventTitle: mockConfiguration.eventTitle,
        group: group.name,
        rankings: ranked,
      },
      'Final rankings calculated successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final rankings', []);
  }
});

router.get('/reports/paper/final-ranking-sheet', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.query || {};
    if (!groupId || !String(groupId).trim()) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }

    const group = getGroupById(String(groupId));
    if (!group) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No scores found to calculate final ranking sheet for this group', []);
    }

    const contestantScores = mockContestants.filter((contestant) => contestant.group === group._id)
      .map((contestant) => ({
        rank: 1,
        nameAndLabel: `${contestant.label} - ${contestant.name}`,
        group: group.name,
        final_candidate_score: mockJudgeScores
          .filter((entry) => entry.contestantId === contestant._id)
          .reduce((sum, entry) => {
            const total = (entry.rubricsScore || []).reduce((acc, item) => acc + Number(item.score || 0), 0);
            return sum + total;
          }, 0),
      }))
      .sort((a, b) => b.final_candidate_score - a.final_candidate_score)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    if (!contestantScores.length) {
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
        rows: contestantScores,
      },
      'Final ranking sheet prepared successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error calculating final ranking sheet', []);
  }
});

router.get('/reports/paper/judge-scoresheet/:judgeId', authenticateToken, (req, res) => {
  try {
    const { judgeId } = req.params;
    const judge = getJudgeById(judgeId);
    if (!judge) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${judgeId}' has no submitted scores`, []);
    }

    const judgeEntries = mockJudgeScores.filter((entry) => entry.judgeId === judgeId);
    if (!judgeEntries.length) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${judgeId}' has no submitted scores`, []);
    }

    const contestants = mockContestants.map((contestant) => {
      const categories = mockCategories.map((category) => {
        const scoreEntry = judgeEntries.find((entry) => entry.categoryId === category._id && entry.contestantId === contestant._id);
        const categoryScore = (scoreEntry?.rubricsScore || []).reduce((sum, item) => sum + Number(item.score || 0), 0);
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
    }).sort((a, b) => b.final_candidate_score - a.final_candidate_score)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return sendSuccess(
      res,
      {
        header: {
          institution: 'Jose Rizal Memorial State University',
          college: 'College of Computing Studies',
          title: 'MR & MS CCS 2026 Judge 1 Scoresheet',
        },
        judgeName: `${judge.firstName} ${judge.lastName}`,
        contestants,
      },
      'Judge scoresheet retrieved successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error generating judge scoresheet', []);
  }
});

export default router;
