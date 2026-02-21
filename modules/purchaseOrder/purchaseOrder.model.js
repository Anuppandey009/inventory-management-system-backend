const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: [poItemSchema],
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'],
      default: 'Draft',
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    expectedDelivery: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ tenantId: 1, createdAt: -1 });

purchaseOrderSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
