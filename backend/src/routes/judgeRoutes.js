import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockJudgeState = [
  {
    _id: '65f8a123b0a9c12345678901',
    username: 'judge001',
    password: 'password123',
    firstName: 'Mario',
    lastName: 'Kart',
    userType: 'Judge',
    isActive: true
  },
  {
    _id: '65f8a123b0a9c12345678902',
    username: 'judge002',
    password: 'password123',
    firstName: 'Mia',
    lastName: 'Luna',
    userType: 'Judge',
    isActive: true
  }
];

router.get('/judges', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can view judges list');
  }

  const sanitizedJudges = mockJudgeState.map(({ password, ...judge }) => judge);
  return sendSuccess(res, sanitizedJudges, 'Judges retrieved successfully', 200);
});

router.post('/judges', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can create judges');
  }

  const { username, password, firstName, lastName, isActive = true } = req.body || {};

  if (!username || !password || !firstName || !lastName) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'username, password, firstName and lastName are required');
  }

  const exists = mockJudgeState.some((judge) => judge.username === username);
  if (exists) {
    return sendError(res, 409, 'DUPLICATE_KEY', `Username '${username}' already exists`);
  }

  const newJudge = {
    _id: `65f8a123b0a9c123456789${String(mockJudgeState.length + 10).padStart(2, '0')}`,
    username,
    password,
    firstName,
    lastName,
    userType: 'Judge',
    isActive
  };

  mockJudgeState.push(newJudge);
  const { password: omittedPassword, ...responseJudge } = newJudge;

  return sendSuccess(res, responseJudge, 'Judge created successfully', 201);
});

router.put('/judges/:id', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can update judges');
  }

  const judge = mockJudgeState.find((item) => item._id === req.params.id);
  if (!judge) {
    return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${req.params.id}' not found`);
  }

  const { username, password, firstName, lastName, isActive } = req.body || {};
  if (username) judge.username = username;
  if (password) judge.password = password;
  if (firstName) judge.firstName = firstName;
  if (lastName) judge.lastName = lastName;
  if (typeof isActive === 'boolean') judge.isActive = isActive;

  const { password: omittedPassword, ...responseJudge } = judge;
  return sendSuccess(res, responseJudge, 'Judge updated successfully', 200);
});

router.delete('/judges/:id', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can delete judges');
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Provided judge ID is not a valid ObjectId');
  }

  const index = mockJudgeState.findIndex((judge) => judge._id === req.params.id);
  if (index === -1) {
    return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Judge ID '${req.params.id}' not found`);
  }

  mockJudgeState.splice(index, 1);
  return sendSuccess(res, null, 'Judge deleted successfully', 200);
});

export default router;
