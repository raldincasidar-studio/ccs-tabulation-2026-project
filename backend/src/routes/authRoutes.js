import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { LoginSession } from '../models/LoginSession.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'PW3D3_N4NG_M4NG4W4T';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Parse JWT_EXPIRES_IN (e.g. '8h') into milliseconds for session expiresAt
const parseExpiry = (str) => {
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60 * 1000;
  const [, val, unit] = match;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Number(val) * (units[unit] || 3600000);
};

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id,
      username: user.username,
      userType: user.userType,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

/**
 * Middleware: Validate JWT and attach req.user from DB.
 * Exported so other route files can protect their endpoints.
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid', []);
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session is still active in DB
    const session = await LoginSession.findOne({ token, isActive: true });
    if (!session || session.expiresAt < new Date()) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid', []);
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid', []);
    }

    req.user = user;
    return next();
  } catch (error) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid', []);
  }
};

// ─── 1.1 POST /auth/login ───
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Username and password are required', []);
    }

    const user = await User.findOne({ username });

    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !passwordMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password', []);
    }

    if (!user.isActive) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password', []);
    }

    const token = signToken(user);
    const expiresAt = new Date(Date.now() + parseExpiry(JWT_EXPIRES_IN));

    // Persist session in DB
    await LoginSession.create({
      userId: user._id,
      token,
      expiresAt,
      isActive: true,
    });

    return sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          username: user.username,
          userType: user.userType,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        expiresAt: expiresAt.toISOString(),
      },
      'Login successful',
      200,
    );
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Login failed', []);
  }
});

// ─── 1.2 POST /auth/logout ───
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization.replace('Bearer ', '').trim();
    await LoginSession.findOneAndUpdate({ token }, { isActive: false });
    return sendSuccess(res, null, 'Logged out successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Logout failed', []);
  }
});

export default router;
