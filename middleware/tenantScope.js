const ApiResponse = require('../utils/apiResponse');

const tenantScope = (req, res, next) => {
  if (!req.tenantId) {
    return ApiResponse.error(res, 'Tenant context missing', 403);
  }
  next();
};

module.exports = { tenantScope };
