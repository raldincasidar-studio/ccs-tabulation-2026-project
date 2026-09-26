import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockConfiguration = {
  _id: '65f8a123b0a9c12345678900',
  eventTitle: '2026 Mr & Ms CCS',
  eventDescription: 'The MR and MS CCS of Acquaintance Party',
  isConfigurationMode: true,
  stats: {
    totalJudges: 5,
    totalContestants: 8
  },
  liveStatus: {
    categoryActive: {
      _id: '65f8a123b0a9c12345678910',
      name: 'Playsuit'
    },
    contestantActive: {
      _id: '65f8a123b0a9c12345678920',
      name: 'Jopeta Mari',
      image: 'https://cdn.example.com/photos/contestant1.jpg',
      label: '1st Year (1)',
      group: 'Pageant Male'
    }
  }
};

router.get('/configuration', authenticateToken, (req, res) => {
  try {
    return sendSuccess(res, mockConfiguration, 'Configuration retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve configuration settings', []);
  }
});

router.put('/configuration', authenticateToken, (req, res) => {
  const { eventTitle, eventDescription } = req.body || {};

  if (!eventTitle || !String(eventTitle).trim()) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'eventTitle is required and cannot be empty', [
      { field: 'eventTitle', issue: 'Must be a non-empty string' }
    ]);
  }

  mockConfiguration.eventTitle = eventTitle;
  mockConfiguration.eventDescription = eventDescription || mockConfiguration.eventDescription;

  return sendSuccess(res, {
    _id: mockConfiguration._id,
    eventTitle: mockConfiguration.eventTitle,
    eventDescription: mockConfiguration.eventDescription
  }, 'Configuration updated successfully', 200);
});

router.patch('/configuration/live-status', authenticateToken, (req, res) => {
  const { categoryActive, contestantActive } = req.body || {};

  if (!categoryActive || !contestantActive) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'categoryActive and contestantActive are required', []);
  }

  const categoryExists = categoryActive === '65f8a123b0a9c12345678910';
  const contestantExists = contestantActive === '65f8a123b0a9c12345678920';

  if (!categoryExists || !contestantExists) {
    return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Specified active category or contestant does not exist', [
      { field: 'categoryActive', issue: 'Category ID not found' }
    ]);
  }

  mockConfiguration.liveStatus = {
    categoryActive: { _id: categoryActive, name: 'Playsuit' },
    contestantActive: {
      _id: contestantActive,
      name: 'Jopeta Mari',
      image: 'https://cdn.example.com/photos/contestant1.jpg',
      label: '1st Year (1)',
      group: 'Pageant Male'
    }
  };

  return sendSuccess(res, {
    categoryActive,
    contestantActive
  }, 'Live status updated successfully', 200);
});

export default router;
