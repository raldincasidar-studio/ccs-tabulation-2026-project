import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { mockCategories, mockContestants, mockContestantGroups, mockJudgeScores, mockConfiguration } from '../mock/mockData.js';

const router = express.Router();

const buildValidationDetails = (field, issue) => [{ field, issue }];

const findActiveCategory = () => mockConfiguration.liveStatus?.categoryActive || null;
const findActiveContestant = () => mockConfiguration.liveStatus?.contestantActive || null;

router.get('/scores/live-sheet', authenticateToken, (req, res) => {
  try {
    const activeCategory = findActiveCategory();
    const activeContestant = findActiveContestant();

    if (!activeCategory || !activeContestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No active category or active contestant set in Live Status', []);
    }

    const category = mockCategories.find((item) => item._id === activeCategory._id);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No active category or active contestant set in Live Status', []);
    }

    const contestant = mockContestants.find((item) => item._id === activeContestant._id) || {
      ...activeContestant,
      group: mockContestantGroups.find((group) => group.name === activeContestant.group)?.name || activeContestant.group,
    };

    const existingScores = (mockJudgeScores || [])
      .filter((score) => score.judgeId === req.user?._id && score.categoryId === category._id && score.contestantId === contestant._id)
      .flatMap((entry) => entry.rubricsScore || []);

    return sendSuccess(
      res,
      {
        category: [{
          _id: category._id,
          name: category.name,
          description: category.description,
          rubrics: category.rubrics.map((rubric) => ({
            _id: rubric._id,
            name: rubric.name,
            maxPoints: rubric.maxPoints,
          })),
        }],
        contestant: {
          _id: contestant._id,
          name: contestant.name,
          label: contestant.label,
          group: contestant.group,
          image: contestant.image,
        },
        existingScores: existingScores.map((item) => ({ rubricsId: item.rubricsId, score: item.score })),
      },
      'Live sheet retrieved successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch live score sheet', []);
  }
});

router.post('/scores/submit', authenticateToken, (req, res) => {
  try {
    const { categoryId, contestantId, rubricsScore = [] } = req.body || {};

    if (!categoryId || !contestantId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoryId and contestantId are required', []);
    }

    const category = mockCategories.find((item) => item._id === categoryId);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${categoryId}' not found`, []);
    }

    const contestant = mockContestants.find((item) => item._id === contestantId);
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Contestant ID '${contestantId}' not found`, []);
    }

    if (!Array.isArray(rubricsScore) || rubricsScore.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'rubricsScore must contain at least one score entry', []);
    }

    const rubricMap = new Map(category.rubrics.map((rubric) => [rubric._id, rubric]));
    const scoreDetails = [];

    for (const entry of rubricsScore) {
      const rubric = rubricMap.get(entry.rubricsId);
      if (!rubric) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid rubric entry provided', buildValidationDetails('rubricsId', 'Unknown rubric ID'));
      }

      const numericScore = Number(entry.score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > rubric.maxPoints) {
        const item = { rubricsId: entry.rubricsId, givenScore: Number(entry.score), maxPoints: rubric.maxPoints };
        return sendError(res, 400, 'SCORE_EXCEEDS_MAX', `Score exceeds maximum points allowed for rubric '${rubric.name}'`, [item]);
      }

      scoreDetails.push({ rubricsId: entry.rubricsId, score: numericScore });
    }

    const existingIndex = mockJudgeScores.findIndex(
      (item) => item.judgeId === req.user?._id && item.categoryId === categoryId && item.contestantId === contestantId,
    );

    const savedEntry = {
      _id: `65f8a123b0a9c123456789${String((mockJudgeScores.length + 90)).padStart(2, '0')}`,
      judgeId: req.user?._id,
      categoryId,
      contestantId,
      rubricsScore: scoreDetails,
    };

    if (existingIndex >= 0) {
      mockJudgeScores[existingIndex] = { ...mockJudgeScores[existingIndex], rubricsScore: scoreDetails };
      return sendSuccess(res, { ...mockJudgeScores[existingIndex], categoryId, contestantId }, 'Scores saved successfully', 200);
    }

    mockJudgeScores.push(savedEntry);
    return sendSuccess(res, { ...savedEntry }, 'Scores saved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to save judge scores', []);
  }
});

export default router;
