const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories } = require('./product.controller');
const { productValidation } = require('./product.validation');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');
const { authorize } = require('../../middleware/roleAccess');

router.use(protect, tenantScope);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', authorize('Owner', 'Manager'), productValidation, createProduct);
router.put('/:id', authorize('Owner', 'Manager'), productValidation, updateProduct);
router.delete('/:id', authorize('Owner'), deleteProduct);

module.exports = router;
