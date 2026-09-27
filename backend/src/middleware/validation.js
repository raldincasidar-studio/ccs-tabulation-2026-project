export const validateRequiredFields = (fields) => (req, res, next) => {
  const missing = [];

  for (const field of fields) {
    const value = req.body?.[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: missing,
      },
    });
  }

  return next();
};

export const validateObjectId = (fieldName = 'id') => (req, res, next) => {
  const value = req.params[fieldName];

  if (!value || !/^[a-fA-F0-9]{24}$/.test(value)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Provided ${fieldName} is not a valid ObjectId`,
        details: [],
      },
    });
  }

  return next();
};

// Sawadika here we go - Jullan