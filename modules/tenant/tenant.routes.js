const express = require('express');
const router = express.Router();
const { getTenant, updateTenant } = require('./tenant.controller');
const { protect } = require('../../middleware/auth');
const { tenantScope } = require('../../middleware/tenantScope');
const { authorize } = require('../../middleware/roleAccess');

router.use(protect, tenantScope);

router.get('/me', getTenant);
router.put('/me', authorize('Owner'), updateTenant);

module.exports = router;
