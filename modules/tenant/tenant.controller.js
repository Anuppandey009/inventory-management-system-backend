const Tenant = require('./tenant.model');
const ApiResponse = require('../../utils/apiResponse');

const getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).populate('owner', 'name email');
    if (!tenant) {
      return ApiResponse.error(res, 'Tenant not found', 404);
    }
    ApiResponse.success(res, { tenant });
  } catch (error) {
    next(error);
  }
};

const updateTenant = async (req, res, next) => {
  try {
    const { name } = req.body;
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      { new: true, runValidators: true }
    );
    if (!tenant) {
      return ApiResponse.error(res, 'Tenant not found', 404);
    }
    ApiResponse.success(res, { tenant }, 'Tenant updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTenant, updateTenant };
