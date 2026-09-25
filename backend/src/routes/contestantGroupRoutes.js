import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockContestantGroups = [
  {
    _id: '65f8a123b0a9c12345678930',
    name: 'Pageant Male',
    categoriesIncluded: ['65f8a123b0a9c12345678910'],
  },
  {
    _id: '65f8a123b0a9c12345678931',
    name: 'Pageant Female',
    categoriesIncluded: ['65f8a123b0a9c12345678920'],
  },
];

const mockContestants = [
  {
    _id: '65f8a123b0a9c12345678920',
    name: 'Jopeta Mari',
    label: '1st Year (1)',
    image: 'https://cdn.example.com/photos/contestant1.jpg',
    group: '65f8a123b0a9c12345678930',
  },
];

const buildValidationDetails = (field, issue) => [{ field, issue }];

router.get('/contestant-groups', authenticateToken, (req, res) => {
  try {
    return sendSuccess(res, mockContestantGroups, 'Contestant groups retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch contestant groups', []);
  }
});

router.post('/contestant-groups', authenticateToken, (req, res) => {
  try {
    const { name, categoriesIncluded = [] } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Contestant group name is required', buildValidationDetails('name', 'Group name is required'));
    }

    if (!Array.isArray(categoriesIncluded)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoriesIncluded array must contain valid Category ObjectIds', buildValidationDetails('categoriesIncluded', 'Expected an array of category IDs'));
    }

    const invalidCategoryId = categoriesIncluded.find((categoryId) => !mongoose.Types.ObjectId.isValid(categoryId));
    if (invalidCategoryId !== undefined) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'categoriesIncluded array must contain valid Category ObjectIds',
        buildValidationDetails('categoriesIncluded[0]', 'Invalid ObjectId provided'),
      );
    }

    const newGroup = {
      _id: `65f8a123b0a9c123456789${String(mockContestantGroups.length + 30).padStart(2, '0')}`,
      name: String(name).trim(),
      categoriesIncluded,
    };

    mockContestantGroups.push(newGroup);
    return sendSuccess(res, newGroup, 'Contestant group created successfully', 201);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create contestant group', []);
  }
});

router.put('/contestant-groups/:id', authenticateToken, (req, res) => {
  try {
    const group = mockContestantGroups.find((item) => item._id === req.params.id);

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

      const invalidCategoryId = categoriesIncluded.find((categoryId) => !mongoose.Types.ObjectId.isValid(categoryId));
      if (invalidCategoryId !== undefined) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'categoriesIncluded array must contain valid Category ObjectIds',
          buildValidationDetails('categoriesIncluded[0]', 'Invalid ObjectId provided'),
        );
      }
    }

    if (name !== undefined) group.name = String(name).trim();
    if (categoriesIncluded !== undefined) group.categoriesIncluded = categoriesIncluded;

    return sendSuccess(res, group, 'Contestant group updated successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update contestant group', []);
  }
});

router.delete('/contestant-groups/:id', authenticateToken, (req, res) => {
  try {
    const hasContestants = mockContestants.some((contestant) => contestant.group === req.params.id);

    if (hasContestants) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Cannot delete group containing registered contestants', []);
    }

    const index = mockContestantGroups.findIndex((group) => group._id === req.params.id);
    if (index === -1) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant group not found', []);
    }

    mockContestantGroups.splice(index, 1);
    return sendSuccess(res, null, 'Contestant group deleted successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete contestant group', []);
  }
});

export default router;
