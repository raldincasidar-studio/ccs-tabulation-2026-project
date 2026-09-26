import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { User } from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

// ─── GET /users ───
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return sendSuccess(res, { count: users.length, items: users }, 'Users retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', error.message, []);
  }
});

// ─── POST /users ───
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const user = await User.create(req.body);
    const { password: _, ...userData } = user.toObject();
    return sendSuccess(res, userData, 'User created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'DUPLICATE_KEY', 'Username already exists', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message, []);
  }
});

// ─── GET /users/:id ───
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'User not found', []);
    }
    return sendSuccess(res, user, 'User retrieved successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid user ID format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message, []);
  }
});

export default router;
