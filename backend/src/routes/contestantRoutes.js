import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { Contestant } from '../models/Contestant.js';
import { ContestantGroup } from '../models/ContestantGroup.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const buildValidationDetails = (field, issue) => [{ field, issue }];

// ─── 6.1 GET /contestants ───
router.get('/contestants', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.query || {};

    if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter', []);
    }

    const filter = groupId ? { group: groupId } : {};
    const contestants = await Contestant.find(filter).populate('group', '_id name');

    return sendSuccess(res, contestants, 'Contestants retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch contestants list', []);
  }
});

// ─── 6.2 POST /contestants ───
router.post('/contestants', authenticateToken, async (req, res) => {
  try {
    const { name, label, image, imageUrl, cloudinaryPublicId, group } = req.body || {};
    const resolvedImage = imageUrl ?? image ?? '';

    if (!name || !String(name).trim() || !label || !String(label).trim() || !group || !String(group).trim()) {
      return sendError(
        res, 400, 'VALIDATION_ERROR', 'Missing required fields',
        [
          { field: 'name', issue: 'Contestant name is required' },
          { field: 'group', issue: 'Target contestant group is required' },
        ],
      );
    }

    if (!mongoose.Types.ObjectId.isValid(group)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid group reference', buildValidationDetails('group', 'Target contestant group is required'));
    }

    // Verify group exists
    const groupExists = await ContestantGroup.findById(group);
    if (!groupExists) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', buildValidationDetails('group', 'Group ID does not exist'));
    }

    const newContestant = await Contestant.create({
      name: String(name).trim(),
      label: String(label).trim(),
      image: String(resolvedImage).trim(),
      cloudinaryPublicId: cloudinaryPublicId ? String(cloudinaryPublicId).trim() : '',
      group,
    });

    return sendSuccess(res, newContestant, 'Contestant created successfully', 201);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create contestant', []);
  }
});

// ─── 6.3 PUT /contestants/:id ───
router.put('/contestants/:id', authenticateToken, async (req, res) => {
  try {
    const contestant = await Contestant.findById(req.params.id);
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Contestant ID '${req.params.id}' not found`, []);
    }

    const { name, label, image, imageUrl, cloudinaryPublicId, group } = req.body || {};
    const resolvedImage = imageUrl !== undefined && imageUrl !== null ? imageUrl : (image !== undefined && image !== null ? image : undefined);

    if (name !== undefined && !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Contestant name is required', buildValidationDetails('name', 'Contestant name is required'));
    }

    if (group !== undefined && !mongoose.Types.ObjectId.isValid(group)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid group reference', buildValidationDetails('group', 'Target contestant group is required'));
    }

    if (name !== undefined) contestant.name = String(name).trim();
    if (label !== undefined) contestant.label = String(label).trim();
    if (resolvedImage !== undefined && resolvedImage !== null) contestant.image = String(resolvedImage).trim();
    if (cloudinaryPublicId !== undefined && cloudinaryPublicId !== null) contestant.cloudinaryPublicId = String(cloudinaryPublicId).trim();
    if (group !== undefined) contestant.group = group;

    await contestant.save();
    return sendSuccess(res, contestant, 'Contestant updated successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update contestant', []);
  }
});

// ─── 6.4 DELETE /contestants/:id ───
router.delete('/contestants/:id', authenticateToken, async (req, res) => {
  try {
    const contestant = await Contestant.findByIdAndDelete(req.params.id);
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant not found', []);
    }

    return sendSuccess(res, null, 'Contestant deleted successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete contestant', []);
  }
});

export default router;
