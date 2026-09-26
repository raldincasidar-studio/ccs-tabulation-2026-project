import express from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockUsers = [
  {
    _id: '64f8a123b0a9c12345678901',
    username: 'admin',
    password: 'adminpassword123',
    userType: 'Admin',
    firstName: 'Admin',
    lastName: 'System',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '64f8a123b0a9c12345678902',
    username: 'judge_donde',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Nay',
    lastName: 'Donde',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

router.get('/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendSuccess(res, { count: mockUsers.length, items: mockUsers }, 'Users retrieved successfully', 200);
    }

    const users = await User.find();
    return sendSuccess(res, { count: users.length, items: users }, 'Users retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', error.message, []);
  }
});

router.post('/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const newUser = {
        _id: `64f8a123b0a9c123456789${String(mockUsers.length + 10).padStart(2, '0')}`,
        ...req.body,
        isActive: req.body.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return sendSuccess(res, newUser, 'User created successfully', 201);
    }

    const user = await User.create(req.body);
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message, []);
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const user = mockUsers.find((item) => item._id === req.params.id);
      if (!user) {
        return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'User not found', []);
      }
      return sendSuccess(res, user, 'User retrieved successfully', 200);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'User not found', []);
    }
    return sendSuccess(res, user, 'User retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message, []);
  }
});

export default router;
