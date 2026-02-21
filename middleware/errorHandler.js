const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.error(res, 'Validation Error', 400, messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `Duplicate value for ${field}`, 409);
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', 401);
  }

  return ApiResponse.error(
    res,
    err.message || 'Internal Server Error',
    err.statusCode || 500
  );
};

module.exports = errorHandler;
