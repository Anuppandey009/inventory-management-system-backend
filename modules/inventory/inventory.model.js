const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    variantSku: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

stockMovementSchema.index({ tenantId: 1, createdAt: -1 });
stockMovementSchema.index({ tenantId: 1, productId: 1 });
stockMovementSchema.index({ tenantId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
