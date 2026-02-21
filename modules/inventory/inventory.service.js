const mongoose = require('mongoose');
const Product = require('../product/product.model');
const StockMovement = require('./inventory.model');
const { emitToTenant } = require('../../utils/socket');

/**
 * Atomically adjust stock for a variant. Uses findOneAndUpdate with a stock floor
 * condition to prevent race conditions and negative stock.
 */
const adjustStock = async ({ tenantId, productId, variantId, type, quantity, reference, note, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stockChange = ['sale'].includes(type) ? -Math.abs(quantity) : Math.abs(quantity);

    const filter = {
      _id: productId,
      tenantId,
      'variants._id': variantId,
    };

    if (stockChange < 0) {
      filter['variants.stock'] = { $gte: Math.abs(stockChange) };
    }

    const productBefore = await Product.findOne(
      { _id: productId, tenantId, 'variants._id': variantId },
      { 'variants.$': 1 }
    ).session(session);

    if (!productBefore || !productBefore.variants[0]) {
      throw Object.assign(new Error('Product variant not found'), { statusCode: 404 });
    }

    const previousStock = productBefore.variants[0].stock;

    const updated = await Product.findOneAndUpdate(
      filter,
      { $inc: { 'variants.$.stock': stockChange } },
      { new: true, session }
    );

    if (!updated) {
      throw Object.assign(
        new Error('Insufficient stock or product not found'),
        { statusCode: 400 }
      );
    }

    const updatedVariant = updated.variants.id(variantId);

    const movement = await StockMovement.create(
      [{
        tenantId,
        productId,
        variantId,
        variantSku: updatedVariant.sku,
        type,
        quantity: Math.abs(quantity),
        previousStock,
        newStock: updatedVariant.stock,
        reference,
        note,
        performedBy: userId,
      }],
      { session }
    );

    await session.commitTransaction();

    emitToTenant(tenantId, 'stock-updated', {
      productId,
      variantId,
      variantSku: updatedVariant.sku,
      type,
      previousStock,
      newStock: updatedVariant.stock,
    });

    return { movement: movement[0], product: updated };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { adjustStock };
