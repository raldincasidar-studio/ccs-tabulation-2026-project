import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { requireJudge } from '../middleware/auth.js';
import { Category } from '../models/Category.js';
import { Contestant } from '../models/Contestant.js';
import { ContestantGroup } from '../models/ContestantGroup.js';

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
// A submission replaces that judge's saved rubric array. Partial arrays are
// allowed; completeness is computed against ALL current category rubrics.
router.post('/scores/submit', authenticateToken, requireJudge, async (req, res) => {
  try {
    const { categoryId, contestantId, rubricsScore = [] } = req.body || {};

    if (!categoryId || !contestantId) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoryId and contestantId are required', []);
    }
    if (![categoryId, contestantId].every((id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id))) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }

    const [category, contestant] = await Promise.all([
      Category.findById(categoryId),
      Contestant.findById(contestantId),
    ]);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${categoryId}' not found`, []);
    }
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Contestant ID '${contestantId}' not found`, []);
    }
    if (!category.isActive || !contestant.isActive || category.rubrics.length === 0) {
      return sendError(res, 409, 'SCORING_UNAVAILABLE', 'Scoring requires an active category, an active contestant and configured rubrics', []);
    }
    if (category.assignedJudges != null && !category.assignedJudges.some((id) => id.toString() === req.user._id.toString())) {
      return sendError(res, 403, 'FORBIDDEN', 'You are not assigned to score this category', []);
    }

    const group = await ContestantGroup.findById(contestant.group).select('categoriesIncluded');
    if (!group?.categoriesIncluded.some((id) => id.toString() === category._id.toString())) {
      return sendError(res, 400, 'VALIDATION_ERROR', "The contestant's group does not include this category", []);
    }
    if (!Array.isArray(rubricsScore) || rubricsScore.length === 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'rubricsScore must contain at least one score entry', []);
    }

    const rubricMap = new Map(category.rubrics.map((rubric) => [rubric._id.toString(), rubric]));
    const seenRubrics = new Set();
    const scoreDetails = [];
    for (const entry of rubricsScore) {
      if (!entry || typeof entry.rubricsId !== 'string') {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid rubric entry provided', []);
      }
      const rubricId = entry.rubricsId.toLowerCase();
      const rubric = rubricMap.get(rubricId);
      if (!rubric) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid rubric entry provided', buildValidationDetails('rubricsId', 'Unknown rubric ID'));
      }
      if (seenRubrics.has(rubricId)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Each rubric may appear only once per score sheet', buildValidationDetails('rubricsId', 'Duplicate rubric ID'));
      }
      seenRubrics.add(rubricId);

      if (typeof entry.score !== 'number' || !Number.isFinite(entry.score)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Each score must be a finite number; blank fields are not zero', buildValidationDetails('score', 'A numeric score is required'));
      }
      if (entry.score < 0 || entry.score > rubric.maxPoints) {
        return sendError(res, 400, 'SCORE_EXCEEDS_MAX', `Score must be between 0 and ${rubric.maxPoints} for rubric '${rubric.name}'`, [
          { rubricsId: entry.rubricsId, givenScore: entry.score, maxPoints: rubric.maxPoints },
        ]);
      }
      scoreDetails.push({ rubricsId: rubricId, score: entry.score });
    }

    const filter = { judgeId: req.user._id, categoryId, contestantId };
    const update = { $set: { ...filter, rubricsScore: scoreDetails } };
    let savedEntry;
    try {
      savedEntry = await JudgeScore.findOneAndUpdate(filter, update,
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
    } catch (error) {
      // Simultaneous first submissions must not create two sheets or fail
      // merely because the other request won the unique-index insert race.
      if (error.code !== 11000) throw error;
      savedEntry = await JudgeScore.findOneAndUpdate(filter, update, { new: true, runValidators: true });
    }

    return sendSuccess(res, savedEntry, 'Scores saved successfully', 200);
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid score sheet', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to save judge scores', []);
  }
});

export default router;
