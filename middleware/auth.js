const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../modules/auth/auth.model');
const ApiResponse = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Not authorized, no token', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return ApiResponse.error(res, 'User not found', 401);
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Not authorized, token failed', 401);
  }
};

module.exports = { protect };
