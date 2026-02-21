const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateStatus,
  receiveDelivery,
  deletePurchaseOrder,
} = require('./purchaseOrder.controller');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');
const { authorize } = require('../../middleware/roleAccess');

router.use(protect, tenantScope);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/', authorize('Owner', 'Manager'), createPurchaseOrder);
router.put('/:id', authorize('Owner', 'Manager'), updatePurchaseOrder);
router.patch('/:id/status', authorize('Owner', 'Manager'), updateStatus);
router.post('/:id/receive', authorize('Owner', 'Manager'), receiveDelivery);
router.delete('/:id', authorize('Owner'), deletePurchaseOrder);

module.exports = router;
