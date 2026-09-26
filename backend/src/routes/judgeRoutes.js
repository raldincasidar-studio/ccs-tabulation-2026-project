import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { User } from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// ─── 3.1 GET /judges ───
router.get('/judges', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can view judges list', []);
    }

    const judges = await User.find({ userType: 'Judge' }).select('-password');
    return sendSuccess(res, judges, 'Judges retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch judges list', []);
  }
});

// ─── 3.2 POST /judges ───
router.post('/judges', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can create judges', []);
    }

    const { username, password, firstName, lastName, isActive = true } = req.body || {};

    if (!username || !password || !firstName || !lastName) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'username, password, firstName and lastName are required', []);
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return sendError(res, 409, 'DUPLICATE_KEY', `Username '${username}' already exists`, []);
    }

    const newJudge = await User.create({
      username,
      password,
      firstName,
      lastName,
      userType: 'Judge',
      isActive,
    });

    const { password: _, ...responseJudge } = newJudge.toObject();
    return sendSuccess(res, responseJudge, 'Judge created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'DUPLICATE_KEY', `Username already exists`, []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to create judge', []);
  }
});

// ─── 3.3 PUT /judges/:id ───
router.put('/judges/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can update judges', []);
    }

    const judge = await User.findOne({ _id: req.params.id, userType: 'Judge' });
    if (!judge) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${req.params.id}' not found`, []);
    }

    const { username, password, firstName, lastName, isActive } = req.body || {};

    if (username) judge.username = username;
    if (password) judge.password = password;
    if (firstName) judge.firstName = firstName;
    if (lastName) judge.lastName = lastName;
    if (typeof isActive === 'boolean') judge.isActive = isActive;

    await judge.save();

    const { password: _, ...responseJudge } = judge.toObject();
    return sendSuccess(res, responseJudge, 'Judge updated successfully', 200);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'DUPLICATE_KEY', `Username already exists`, []);
    }
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Provided judge ID is not a valid ObjectId', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update judge', []);
  }
});

// ─── 3.4 DELETE /judges/:id ───
router.delete('/judges/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'Admin') {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can delete judges', []);
    }

    const judge = await User.findOneAndDelete({ _id: req.params.id, userType: 'Judge' });
    if (!judge) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${req.params.id}' not found`, []);
    }

    return sendSuccess(res, null, 'Judge deleted successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Provided judge ID is not a valid ObjectId', []);
    }
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to delete judge', []);
  }
});

export default router;
