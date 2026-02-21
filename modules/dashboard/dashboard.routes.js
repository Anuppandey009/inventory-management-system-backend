const express = require('express');
const router = express.Router();
const { getDashboardStats, getLowStockItems, getTopSellers, getStockMovementGraph } = require('./dashboard.controller');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');

router.use(protect, tenantScope);

router.get('/stats', getDashboardStats);
router.get('/low-stock', getLowStockItems);
router.get('/top-sellers', getTopSellers);
router.get('/stock-graph', getStockMovementGraph);

module.exports = router;
