import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { Category } from '../models/Category.js';
import { Contestant } from '../models/Contestant.js';

import { JudgeScore } from '../models/JudgeScore.js';
import { Configuration } from '../models/Configuration.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const buildValidationDetails = (field, issue) => [{ field, issue }];

// ─── 7.1 GET /scores/live-sheet ───
router.get('/scores/live-sheet', authenticateToken, async (req, res) => {
  try {
    const config = await Configuration.findOne();

    if (!config?.liveStatus?.categoryActive || !config?.liveStatus?.contestantActive) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No active category or active contestant set in Live Status', []);
    }

    const category = await Category.findById(config.liveStatus.categoryActive);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No active category or active contestant set in Live Status', []);
    }

    const contestant = await Contestant.findById(config.liveStatus.contestantActive)
      .populate('group', 'name');
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'No active category or active contestant set in Live Status', []);
    }

    // Fetch existing scores for this judge + category + contestant
    const existingScoreDoc = await JudgeScore.findOne({
      judgeId: req.user._id,
      categoryId: category._id,
      contestantId: contestant._id,
    });

    const existingScores = existingScoreDoc
      ? existingScoreDoc.rubricsScore.map((item) => ({ rubricsId: item.rubricsId, score: item.score }))
      : [];

    return sendSuccess(
      res,
      {
        category: [{
          _id: category._id,
          name: category.name,
          description: category.description,
          rubrics: category.rubrics.map((r) => ({
            _id: r._id,
            name: r.name,
            maxPoints: r.maxPoints,
          })),
        }],
        contestant: {
          _id: contestant._id,
          name: contestant.name,
          label: contestant.label,
          group: contestant.group?.name || '',
          image: contestant.image,
        },
        existingScores,
      },
      'Live sheet retrieved successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch live score sheet', []);
  }
});

// ─── 7.2 POST /scores/submit ───
router.post('/scores/submit', authenticateToken, async (req, res) => {
  try {
    const { categoryId, contestantId, rubricsScore = [] } = req.body || {};

    if (!categoryId || !contestantId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoryId and contestantId are required', []);
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${categoryId}' not found`, []);
    }

    const contestant = await Contestant.findById(contestantId);
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Contestant ID '${contestantId}' not found`, []);
    }

    if (!Array.isArray(rubricsScore) || rubricsScore.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'rubricsScore must contain at least one score entry', []);
    }

    // Build rubric lookup from the category
    const rubricMap = new Map(category.rubrics.map((r) => [r._id.toString(), r]));
    const scoreDetails = [];

    for (const entry of rubricsScore) {
      const rubric = rubricMap.get(String(entry.rubricsId));
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

    // Upsert: update if exists, create if not
    const savedEntry = await JudgeScore.findOneAndUpdate(
      {
        judgeId: req.user._id,
        categoryId,
        contestantId,
      },
      {
        judgeId: req.user._id,
        categoryId,
        contestantId,
        rubricsScore: scoreDetails,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return sendSuccess(res, savedEntry, 'Scores saved successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to save judge scores', []);
  }
});

export default router;
