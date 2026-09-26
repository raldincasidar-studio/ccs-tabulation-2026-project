import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockContestants = [
  {
    _id: '65f8a123b0a9c12345678920',
    name: 'Jopeta Mari',
    label: '1st Year (1)',
    image: 'https://cdn.example.com/photos/contestant1.jpg',
    group: '65f8a123b0a9c12345678930',
  },
];

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

const buildValidationDetails = (field, issue) => [{ field, issue }];

router.get('/contestants', authenticateToken, (req, res) => {
  try {
    const { groupId } = req.query || {};

    if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid groupId query parameter', []);
    }

    const filteredContestants = groupId
      ? mockContestants.filter((contestant) => contestant.group === groupId)
      : mockContestants;

    const populated = filteredContestants.map((contestant) => {
      const group = mockContestantGroups.find((item) => item._id === contestant.group);
      return {
        ...contestant,
        group: group
          ? {
              _id: group._id,
              name: group.name,
            }
          : contestant.group,
      };
    });

    return sendSuccess(res, populated, 'Contestants retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch contestants list', []);
  }
});

router.post('/contestants', authenticateToken, (req, res) => {
  try {
    const { name, label, image, group } = req.body || {};

    if (!name || !String(name).trim() || !label || !String(label).trim() || !group || !String(group).trim()) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Missing required fields',
        [
          { field: 'name', issue: 'Contestant name is required' },
          { field: 'group', issue: 'Target contestant group is required' },
        ],
      );
    }

    if (!mongoose.Types.ObjectId.isValid(group)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid group reference', buildValidationDetails('group', 'Target contestant group is required'));
    }

    const newContestant = {
      _id: `65f8a123b0a9c123456789${String(mockContestants.length + 20).padStart(2, '0')}`,
      name: String(name).trim(),
      label: String(label).trim(),
      image: image || '',
      group: String(group).trim(),
    };

    mockContestants.push(newContestant);
    return sendSuccess(res, newContestant, 'Contestant created successfully', 201);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create contestant', []);
  }
});

router.put('/contestants/:id', authenticateToken, (req, res) => {
  try {
    const contestant = mockContestants.find((item) => item._id === req.params.id);
    if (!contestant) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Contestant ID '${req.params.id}' not found`, []);
    }

    const { name, label, image, group } = req.body || {};

    if (name !== undefined && !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Contestant name is required', buildValidationDetails('name', 'Contestant name is required'));
    }

    if (group !== undefined && !mongoose.Types.ObjectId.isValid(group)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid group reference', buildValidationDetails('group', 'Target contestant group is required'));
    }

    if (name !== undefined) contestant.name = String(name).trim();
    if (label !== undefined) contestant.label = String(label).trim();
    if (image !== undefined) contestant.image = String(image).trim();
    if (group !== undefined) contestant.group = String(group).trim();

    return sendSuccess(res, contestant, 'Contestant updated successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update contestant', []);
  }
});

router.delete('/contestants/:id', authenticateToken, (req, res) => {
  try {
    const index = mockContestants.findIndex((contestant) => contestant._id === req.params.id);
    if (index === -1) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Contestant not found', []);
    }

    mockContestants.splice(index, 1);
    return sendSuccess(res, null, 'Contestant deleted successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete contestant', []);
  }
});

export default router;
