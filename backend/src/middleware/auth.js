import { sendError } from '../utils/response.js';

// These role guards run after authenticateToken (which validates the JWT,
// database session and current user). A claim alone is not sufficient.
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'Admin') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Admins can perform this action', []);
  }
  return next();
};

export const requireJudge = (req, res, next) => {
  if (!req.user || req.user.userType !== 'Judge') {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Only Judges can submit scores', []);
  }
  return next();
};

export const requireJudgeOrAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'Judge'].includes(req.user.userType)) {
    return sendError(res, 403, 'FORBIDDEN', 'Access denied. Invalid role', []);
  }
  return next();
};
