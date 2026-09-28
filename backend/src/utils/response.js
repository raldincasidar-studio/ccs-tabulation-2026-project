export const sendSuccess = (res, data = null, message = 'Operation successful', status = 200) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) {
    body.data = data;
  }
  return res.status(status).json(body);
};

export const sendError = (res, status, code, message, details = []) => {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
