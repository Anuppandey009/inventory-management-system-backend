const mongoose = require('mongoose');

const supplierProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  leadTimeDays: {
    type: Number,
    default: 7,
    min: 0,
  },
}, { _id: true });

const supplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: 200,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    products: [supplierProductSchema],
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, name: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
