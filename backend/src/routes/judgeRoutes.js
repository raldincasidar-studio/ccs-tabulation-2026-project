import express from 'express';
import { authenticateToken } from './authRoutes.js';

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
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Only Admins can view judges list',
        details: []
      }
    });
  }

  const sanitizedJudges = mockJudgeState.map(({ password, ...judge }) => judge);
  return res.status(200).json({ success: true, data: sanitizedJudges });
});

router.post('/judges', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Only Admins can create judges',
        details: []
      }
    });
  }

  const { username, password, firstName, lastName, isActive = true } = req.body || {};

  if (!username || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'username, password, firstName and lastName are required',
        details: []
      }
    });
  }

  const exists = mockJudgeState.some((judge) => judge.username === username);
  if (exists) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `Username '${username}' already exists`,
        details: []
      }
    });
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

  return res.status(201).json({
    success: true,
    message: 'Judge created successfully',
    data: responseJudge
  });
});

router.put('/judges/:id', authenticateToken, (req, res) => {
  if (req.user.userType !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Only Admins can update judges',
        details: []
      }
    });
  }

  const judge = mockJudgeState.find((item) => item._id === req.params.id);
  if (!judge) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: `Judge ID '${req.params.id}' not found`,
        details: []
      }
    });
  }

  const { username, password, firstName, lastName, isActive } = req.body || {};
  if (username) judge.username = username;
  if (password) judge.password = password;
  if (firstName) judge.firstName = firstName;
  if (lastName) judge.lastName = lastName;
  if (typeof isActive === 'boolean') judge.isActive = isActive;

  const { password: omittedPassword, ...responseJudge } = judge;
  return res.status(200).json({
    success: true,
    message: 'Judge updated successfully',
    data: responseJudge
  });
});

export default router;
