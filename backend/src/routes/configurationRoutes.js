import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { Configuration } from '../models/Configuration.js';
import { User } from '../models/User.js';
import { Contestant } from '../models/Contestant.js';
import { Category } from '../models/Category.js';
import { ContestantGroup } from '../models/ContestantGroup.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// ─── 2.1 GET /configuration ───
router.get('/configuration', authenticateToken, async (req, res) => {
  try {
    let config = await Configuration.findOne();

    if (!config) {
      config = await Configuration.create({
        eventTitle: '2026 Mr & Ms CCS',
        eventDescription: 'The MR and MS CCS of Acquaintance Party',
        isConfigurationMode: true,
      });
    }

    // Compute live stats from actual collections
    const totalJudges = await User.countDocuments({ userType: 'Judge', isActive: true });
    const totalContestants = await Contestant.countDocuments();

    // Populate live status references
    let liveStatusData = { categoryActive: null, contestantActive: null };

    if (config.liveStatus?.categoryActive) {
      const cat = await Category.findById(config.liveStatus.categoryActive).select('_id name');
      if (cat) liveStatusData.categoryActive = { _id: cat._id, name: cat.name };
    }

    if (config.liveStatus?.contestantActive) {
      const contestant = await Contestant.findById(config.liveStatus.contestantActive)
        .populate('group', 'name');
      if (contestant) {
        liveStatusData.contestantActive = {
          _id: contestant._id,
          name: contestant.name,
          image: contestant.image,
          label: contestant.label,
          group: contestant.group?.name || '',
        };
      }
    }

    return sendSuccess(
      res,
      {
        _id: config._id,
        eventTitle: config.eventTitle,
        eventDescription: config.eventDescription,
        isConfigurationMode: config.isConfigurationMode,
        stats: { totalJudges, totalContestants },
        liveStatus: liveStatusData,
      },
      'Configuration retrieved successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve configuration settings', []);
  }
});

// ─── 2.2 PUT /configuration ───
router.put('/configuration', authenticateToken, async (req, res) => {
  try {
    const { eventTitle, eventDescription } = req.body || {};

    if (!eventTitle || !String(eventTitle).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'eventTitle is required and cannot be empty', [
        { field: 'eventTitle', issue: 'Must be a non-empty string' },
      ]);
    }

    let config = await Configuration.findOne();
    if (!config) {
      config = await Configuration.create({
        eventTitle: String(eventTitle).trim(),
        eventDescription: eventDescription || '',
      });
    } else {
      config.eventTitle = String(eventTitle).trim();
      if (eventDescription !== undefined) config.eventDescription = String(eventDescription).trim();
      await config.save();
    }

    return sendSuccess(
      res,
      {
        _id: config._id,
        eventTitle: config.eventTitle,
        eventDescription: config.eventDescription,
      },
      'Configuration updated successfully',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update configuration', []);
  }
});

// ─── 2.3 PATCH /configuration/live-status ───
router.patch('/configuration/live-status', authenticateToken, async (req, res) => {
  try {
    const { categoryActive, contestantActive } = req.body || {};

    if (!categoryActive || !contestantActive) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'categoryActive and contestantActive are required', []);
    }

    const categoryExists = await Category.findById(categoryActive);
    if (!categoryExists) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Specified active category or contestant does not exist', [
        { field: 'categoryActive', issue: 'Category ID not found' },
      ]);
    }

    const contestantExists = await Contestant.findById(contestantActive);
    if (!contestantExists) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Specified active category or contestant does not exist', [
        { field: 'contestantActive', issue: 'Contestant ID not found' },
      ]);
    }

    let config = await Configuration.findOne();
    if (!config) {
      config = await Configuration.create({
        eventTitle: '2026 Mr & Ms CCS',
        liveStatus: { categoryActive, contestantActive },
      });
    } else {
      config.liveStatus = { categoryActive, contestantActive };
      await config.save();
    }

    return sendSuccess(
      res,
      { categoryActive, contestantActive },
      'Live status updated successfully',
      200,
    );
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update live status', []);
  }
});

export default router;
