import express from 'express';
import { authenticateToken } from './authRoutes.js';

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

const makeError = (code, message, details = []) => ({
  success: false,
  error: { code, message, details }
});

router.get('/configuration', authenticateToken, (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: mockConfiguration
    });
  } catch (error) {
    return res.status(500).json(
      makeError('INTERNAL_SERVER_ERROR', 'Failed to retrieve configuration settings', [])
    );
  }
});

router.put('/configuration', authenticateToken, (req, res) => {
  const { eventTitle, eventDescription } = req.body || {};

  if (!eventTitle || !String(eventTitle).trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'eventTitle is required and cannot be empty',
        details: [{ field: 'eventTitle', issue: 'Must be a non-empty string' }]
      }
    });
  }

  mockConfiguration.eventTitle = eventTitle;
  mockConfiguration.eventDescription = eventDescription || mockConfiguration.eventDescription;

  return res.status(200).json({
    success: true,
    message: 'Configuration updated successfully',
    data: {
      _id: mockConfiguration._id,
      eventTitle: mockConfiguration.eventTitle,
      eventDescription: mockConfiguration.eventDescription
    }
  });
});

router.patch('/configuration/live-status', authenticateToken, (req, res) => {
  const { categoryActive, contestantActive } = req.body || {};

  if (!categoryActive || !contestantActive) {
    return res.status(400).json(
      makeError('VALIDATION_ERROR', 'categoryActive and contestantActive are required', [])
    );
  }

  const categoryExists = categoryActive === '65f8a123b0a9c12345678910';
  const contestantExists = contestantActive === '65f8a123b0a9c12345678920';

  if (!categoryExists || !contestantExists) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Specified active category or contestant does not exist',
        details: [{ field: 'categoryActive', issue: 'Category ID not found' }]
      }
    });
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

  return res.status(200).json({
    success: true,
    message: 'Live status updated successfully',
    data: {
      categoryActive,
      contestantActive
    }
  });
});

export default router;
