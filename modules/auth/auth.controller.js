const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('./auth.model');
const Tenant = require('../tenant/tenant.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const ApiResponse = require('../../utils/apiResponse');

const generateToken = (user) => {
  const tenantId = user.tenantId?._id || user.tenantId;
  return jwt.sign(
    { id: user._id, tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { name, email, password, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.error(res, 'Email already registered', 409);
    }

    const tenant = await Tenant.create({
      name: companyName,
      slug: companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });

    const user = await User.create({
      tenantId: tenant._id,
      name,
      email,
      password,
      role: 'Owner',
    });

    tenant.owner = user._id;
    await tenant.save();

    const token = generateToken(user);

    ApiResponse.created(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: tenant._id },
      tenant: { id: tenant._id, name: tenant.name },
      token,
    }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('tenantId', 'name slug');
    if (!user || !(await user.comparePassword(password))) {
      return ApiResponse.error(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);

    ApiResponse.success(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId._id },
      tenant: { id: user.tenantId._id, name: user.tenantId.name },
      token,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('tenantId', 'name slug');
    ApiResponse.success(res, {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId._id },
      tenant: { id: user.tenantId._id, name: user.tenantId.name },
    });
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ tenantId: req.tenantId, email });
    if (existingUser) {
      return ApiResponse.error(res, 'User with this email already exists in your organization', 409);
    }

    const user = await User.create({
      tenantId: req.tenantId,
      name,
      email,
      password,
      role,
    });

    ApiResponse.created(res, { user }, 'User added successfully');
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId }).select('-password');
    ApiResponse.success(res, { users });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, addUser, getUsers };
