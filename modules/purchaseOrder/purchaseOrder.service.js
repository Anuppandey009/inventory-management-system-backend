const mongoose = require('mongoose');
const PurchaseOrder = require('./purchaseOrder.model');
const { adjustStock } = require('../inventory/inventory.service');

const generateOrderNumber = async (tenantId) => {
  const count = await PurchaseOrder.countDocuments({ tenantId });
  return `PO-${String(count + 1).padStart(5, '0')}`;
};

const VALID_TRANSITIONS = {
  Draft: ['Sent', 'Cancelled'],
  Sent: ['Confirmed', 'Cancelled'],
  Confirmed: ['Partially Received', 'Received', 'Cancelled'],
  'Partially Received': ['Partially Received', 'Received'],
  Received: [],
  Cancelled: [],
};

const validateTransition = (currentStatus, newStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition from '${currentStatus}' to '${newStatus}'`),
      { statusCode: 400 }
    );
  }
};

const receiveItems = async ({ purchaseOrder, receivedItems, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const received of receivedItems) {
      const poItem = purchaseOrder.items.id(received.itemId);
      if (!poItem) {
        throw Object.assign(new Error(`PO item ${received.itemId} not found`), { statusCode: 404 });
      }

      const remaining = poItem.quantity - poItem.receivedQuantity;
      if (received.quantity > remaining) {
        throw Object.assign(
          new Error(`Cannot receive ${received.quantity} for SKU ${poItem.variantSku}. Only ${remaining} remaining.`),
          { statusCode: 400 }
        );
      }

      poItem.receivedQuantity += received.quantity;

      await adjustStock({
        tenantId: purchaseOrder.tenantId,
        productId: poItem.productId,
        variantId: poItem.variantId,
        type: 'purchase',
        quantity: received.quantity,
        reference: `PO: ${purchaseOrder.orderNumber}`,
        note: `Received from PO ${purchaseOrder.orderNumber}`,
        userId,
      });
    }

    const allReceived = purchaseOrder.items.every((item) => item.receivedQuantity >= item.quantity);
    const someReceived = purchaseOrder.items.some((item) => item.receivedQuantity > 0);

    if (allReceived) {
      purchaseOrder.status = 'Received';
    } else if (someReceived) {
      purchaseOrder.status = 'Partially Received';
    }

    await purchaseOrder.save({ session });
    await session.commitTransaction();

    return purchaseOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { generateOrderNumber, validateTransition, receiveItems };
