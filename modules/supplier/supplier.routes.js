const express = require('express');
const router = express.Router();
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('./supplier.controller');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');
const { authorize } = require('../../middleware/roleAccess');

router.use(protect, tenantScope);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', authorize('Owner', 'Manager'), createSupplier);
router.put('/:id', authorize('Owner', 'Manager'), updateSupplier);
router.delete('/:id', authorize('Owner'), deleteSupplier);

module.exports = router;
