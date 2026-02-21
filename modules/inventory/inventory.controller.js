const { validationResult } = require('express-validator');
const StockMovement = require('./inventory.model');
const { adjustStock } = require('./inventory.service');
const ApiResponse = require('../../utils/apiResponse');

const getStockMovements = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, productId, type, from, to } = req.query;
    const query = { tenantId: req.tenantId };

    if (productId) query.productId = productId;
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('productId', 'name')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    ApiResponse.paginated(res, movements, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const createStockAdjustment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { productId, variantId, type, quantity, reference, note } = req.body;

    const result = await adjustStock({
      tenantId: req.tenantId,
      productId,
      variantId,
      type,
      quantity,
      reference,
      note,
      userId: req.user._id,
    });

    ApiResponse.created(res, result, 'Stock adjusted successfully');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.error(res, error.message, error.statusCode);
    }
    next(error);
  }
};

module.exports = { getStockMovements, createStockAdjustment };
