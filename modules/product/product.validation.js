const { body } = require('express-validator');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').optional().trim(),
  body('variants')
    .isArray({ min: 1 })
    .withMessage('At least one variant is required'),
  body('variants.*.sku').trim().notEmpty().withMessage('SKU is required for each variant'),
  body('variants.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('variants.*.costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a non-negative number'),
  body('variants.*.stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('variants.*.lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),
];

module.exports = { productValidation };
