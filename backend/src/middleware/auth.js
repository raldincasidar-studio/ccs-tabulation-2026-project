import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'PW3D3_N4NG_M4NG4W4T';

/**
 * Standalone auth middleware (not tied to routes).
 * NOTE: The primary authenticateToken used by all routes is exported
 * from routes/authRoutes.js and includes session validation.
 * This file provides reusable role-checking middleware.
 */

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can perform this action', []);
  }

  return next();
};

export const requireJudgeOrAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'Judge'].includes(req.user.userType)) {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Invalid role', []);
  }

  return next();
};
