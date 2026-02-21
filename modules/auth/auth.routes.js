const express = require('express');
const router = express.Router();
const { register, login, getMe, addUser, getUsers } = require('./auth.controller');
const { registerValidation, loginValidation, addUserValidation } = require('./auth.validation');
const { protect } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleAccess');
const { tenantScope } = require('../../middleware/tenantScope');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/users', protect, tenantScope, authorize('Owner'), addUserValidation, addUser);
router.get('/users', protect, tenantScope, authorize('Owner', 'Manager'), getUsers);

module.exports = router;
