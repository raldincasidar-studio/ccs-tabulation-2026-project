import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'GW4P0_S1_JULY4N'; // Sulayi gani ni

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid',
        details: [],
      },
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid',
        details: [],
      },
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.userType !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Only Admins can perform this action',
        details: [],
      },
    });
  }

  return next();
};

export const requireJudgeOrAdmin = (req, res, next) => {
  if (!req.user || !['Admin', 'Judge'].includes(req.user.userType)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Invalid role',
        details: [],
      },
    });
  }

  return next();
};
