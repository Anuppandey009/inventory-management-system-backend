const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    variants: [variantSchema],
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, name: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, 'variants.sku': 1 });
productSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
