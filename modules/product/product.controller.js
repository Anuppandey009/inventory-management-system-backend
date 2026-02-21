const { validationResult } = require('express-validator');
const Product = require('./product.model');
const ApiResponse = require('../../utils/apiResponse');

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const query = { tenantId: req.tenantId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    ApiResponse.paginated(res, products, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!product) return ApiResponse.error(res, 'Product not found', 404);
    ApiResponse.success(res, { product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { name, description, category, variants } = req.body;
    const product = await Product.create({
      tenantId: req.tenantId,
      name,
      description,
      category,
      variants,
    });

    ApiResponse.created(res, { product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, 'Validation failed', 400, errors.array());
    }

    const { name, description, category, variants } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { name, description, category, variants },
      { new: true, runValidators: true }
    );

    if (!product) return ApiResponse.error(res, 'Product not found', 404);
    ApiResponse.success(res, { product }, 'Product updated');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!product) return ApiResponse.error(res, 'Product not found', 404);
    ApiResponse.success(res, null, 'Product deleted');
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { tenantId: req.tenantId });
    ApiResponse.success(res, { categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };
