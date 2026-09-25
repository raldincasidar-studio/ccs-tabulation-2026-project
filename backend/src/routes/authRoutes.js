import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const mockUsers = [
  {
    _id: '64f8a123b0a9c12345678901',
    username: 'admin',
    password: 'adminpassword123',
    userType: 'Admin',
    firstName: 'Admin',
    lastName: 'System'
  },
  {
    _id: '64f8a123b0a9c12345678902',
    username: 'judge_donde',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Nay',
    lastName: 'Donde'
  },
  {
    _id: '64f8a123b0a9c12345678903',
    username: 'judge_lester',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Sir',
    lastName: 'Lester'
  },
  {
    _id: '64f8a123b0a9c12345678904',
    username: 'judge_daynver',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Sir',
    lastName: 'Daynver'
  },
  {
    _id: '64f8a123b0a9c12345678905',
    username: 'judge_jhunie',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Sir Jhunie',
    lastName: 'Jumawan'
  },
  {
    _id: '64f8a123b0a9c12345678906',
    username: 'judge_noreen',
    password: 'password123',
    userType: 'Judge',
    firstName: 'Ma\'am Noreen',
    lastName: 'Lagahit'
  }
];

const mockUserMap = new Map(mockUsers.map((user) => [user.username, user]));
const JWT_SECRET = process.env.JWT_SECRET || 'GW4P0_S1_JULY4N';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const makeError = (code, message, details = []) => ({
  success: false,
  error: { code, message, details }
});

const makeSuccess = (message, data = {}) => ({
  success: true,
  message,
  data
});

const signToken = (user) => jwt.sign(
  {
    sub: user._id,
    username: user.username,
    userType: user.userType
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json(
      makeError('UNAUTHORIZED', 'Authentication token missing or invalid', [])
    );
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = mockUserMap.get(decoded.username) || mockUsers.find((item) => item._id === decoded.sub);

    if (!user) {
      return res.status(401).json(
        makeError('UNAUTHORIZED', 'Authentication token missing or invalid', [])
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json(
      makeError('UNAUTHORIZED', 'Authentication token missing or invalid', [])
    );
  }
};

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json(
      makeError('VALIDATION_ERROR', 'Username and password are required', [])
    );
  }

  const user = mockUserMap.get(username);

  if (!user || user.password !== password) {
    return res.status(401).json(
      makeError('INVALID_CREDENTIALS', 'Invalid username or password', [])
    );
  }

  const token = signToken(user);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  return res.status(200).json(
    makeSuccess('Login successful', {
      token,
      user: {
        _id: user._id,
        username: user.username,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      },
      expiresAt
    })
  );
});

router.post('/auth/logout', authenticateToken, (req, res) => {
  return res.status(200).json(makeSuccess('Logged out successfully'));
});

export default router;
