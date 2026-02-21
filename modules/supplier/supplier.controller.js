const { validationResult } = require('express-validator');
const Supplier = require('./supplier.model');
const ApiResponse = require('../../utils/apiResponse');

const getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { tenantId: req.tenantId };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .populate('products.productId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    ApiResponse.paginated(res, suppliers, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('products.productId', 'name variants');
    if (!supplier) return ApiResponse.error(res, 'Supplier not found', 404);
    ApiResponse.success(res, { supplier });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, address, products } = req.body;
    const supplier = await Supplier.create({
      tenantId: req.tenantId,
      name,
      email,
      phone,
      address,
      products: products || [],
    });
    ApiResponse.created(res, { supplier });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, address, products } = req.body;
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { name, email, phone, address, products },
      { new: true, runValidators: true }
    );
    if (!supplier) return ApiResponse.error(res, 'Supplier not found', 404);
    ApiResponse.success(res, { supplier }, 'Supplier updated');
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!supplier) return ApiResponse.error(res, 'Supplier not found', 404);
    ApiResponse.success(res, null, 'Supplier deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
