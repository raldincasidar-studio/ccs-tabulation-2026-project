import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { ContestantGroup } from '../models/ContestantGroup.js';
import { Contestant } from '../models/Contestant.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const buildValidationDetails = (field, issue) => [{ field, issue }];

// ─── 5.1 GET /contestant-groups ───
router.get('/contestant-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await ContestantGroup.find();
    return sendSuccess(res, groups, 'Contestant groups retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch contestant groups', []);
  }
});

// ─── 5.2 POST /contestant-groups ───
router.post('/contestant-groups', authenticateToken, async (req, res) => {
  try {
    const { name, categoriesIncluded = [] } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Contestant group name is required', buildValidationDetails('name', 'Group name is required'));
    }

    if (!Array.isArray(categoriesIncluded)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoriesIncluded array must contain valid Category ObjectIds', buildValidationDetails('categoriesIncluded', 'Expected an array of category IDs'));
    }

    const invalidId = categoriesIncluded.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId !== undefined) {
      return sendError(
        res, 400, 'VALIDATION_ERROR',
        'categoriesIncluded array must contain valid Category ObjectIds',
        buildValidationDetails('categoriesIncluded[0]', 'Invalid ObjectId provided'),
      );
    }

    const newGroup = await ContestantGroup.create({
      name: String(name).trim(),
      categoriesIncluded,
    });

    return sendSuccess(res, newGroup, 'Contestant group created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'DUPLICATE_KEY', 'Contestant group name already exists', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create contestant group', []);
  }
});

// ─── 5.3 PUT /contestant-groups/:id ───
router.put('/contestant-groups/:id', authenticateToken, async (req, res) => {
  try {
    const group = await ContestantGroup.findById(req.params.id);
    if (!group) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    }

    const { name, categoriesIncluded } = req.body || {};

    if (name !== undefined && !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Contestant group name cannot be empty', buildValidationDetails('name', 'Group name is required'));
    }

    if (categoriesIncluded !== undefined) {
      if (!Array.isArray(categoriesIncluded)) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'categoriesIncluded array must contain valid Category ObjectIds', buildValidationDetails('categoriesIncluded', 'Expected an array of category IDs'));
      }

      const invalidId = categoriesIncluded.find((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidId !== undefined) {
        return sendError(
          res, 400, 'VALIDATION_ERROR',
          'categoriesIncluded array must contain valid Category ObjectIds',
          buildValidationDetails('categoriesIncluded[0]', 'Invalid ObjectId provided'),
        );
      }
    }

    if (name !== undefined) group.name = String(name).trim();
    if (categoriesIncluded !== undefined) group.categoriesIncluded = categoriesIncluded;

    await group.save();
    return sendSuccess(res, group, 'Contestant group updated successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update contestant group', []);
  }
});

// ─── 5.4 DELETE /contestant-groups/:id ───
router.delete('/contestant-groups/:id', authenticateToken, async (req, res) => {
  try {
    const hasContestants = await Contestant.findOne({ group: req.params.id });
    if (hasContestants) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Cannot delete group containing registered contestants', []);
    }

    const group = await ContestantGroup.findByIdAndDelete(req.params.id);
    if (!group) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    }

    return sendSuccess(res, null, 'Contestant group deleted successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete contestant group', []);
  }
});

export default router;
