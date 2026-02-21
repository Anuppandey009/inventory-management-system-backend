const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getStockMovements, createStockAdjustment } = require('./inventory.controller');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');
const { authorize } = require('../../middleware/roleAccess');

router.use(protect, tenantScope);

router.get('/movements', getStockMovements);

router.post(
  '/adjust',
  authorize('Owner', 'Manager'),
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('variantId').notEmpty().withMessage('Variant ID is required'),
    body('type').isIn(['purchase', 'sale', 'return', 'adjustment']).withMessage('Invalid movement type'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  ],
  createStockAdjustment
);

module.exports = router;
