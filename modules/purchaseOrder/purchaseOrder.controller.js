const PurchaseOrder = require('./purchaseOrder.model');
const { generateOrderNumber, validateTransition, receiveItems } = require('./purchaseOrder.service');
const ApiResponse = require('../../utils/apiResponse');

const getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, supplierId } = req.query;
    const query = { tenantId: req.tenantId };
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;

    const total = await PurchaseOrder.countDocuments(query);
    const orders = await PurchaseOrder.find(query)
      .populate('supplierId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    ApiResponse.paginated(res, orders, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('supplierId', 'name email phone')
      .populate('items.productId', 'name')
      .populate('createdBy', 'name');
    if (!order) return ApiResponse.error(res, 'Purchase order not found', 404);
    ApiResponse.success(res, { order });
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items, notes, expectedDelivery } = req.body;
    const orderNumber = await generateOrderNumber(req.tenantId);

    const order = await PurchaseOrder.create({
      tenantId: req.tenantId,
      orderNumber,
      supplierId,
      items,
      notes,
      expectedDelivery,
      createdBy: req.user._id,
    });

    const populated = await order.populate([
      { path: 'supplierId', select: 'name' },
      { path: 'createdBy', select: 'name' },
    ]);

    ApiResponse.created(res, { order: populated });
  } catch (error) {
    next(error);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return ApiResponse.error(res, 'Purchase order not found', 404);

    if (order.status !== 'Draft') {
      return ApiResponse.error(res, 'Only draft orders can be edited', 400);
    }

    const { supplierId, items, notes, expectedDelivery } = req.body;
    Object.assign(order, { supplierId, items, notes, expectedDelivery });
    await order.save();

    ApiResponse.success(res, { order }, 'Purchase order updated');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return ApiResponse.error(res, 'Purchase order not found', 404);

    try {
      validateTransition(order.status, status);
    } catch (err) {
      return ApiResponse.error(res, err.message, 400);
    }

    order.status = status;
    await order.save();

    ApiResponse.success(res, { order }, `Status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const receiveDelivery = async (req, res, next) => {
  try {
    const { receivedItems } = req.body;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return ApiResponse.error(res, 'Purchase order not found', 404);

    if (!['Confirmed', 'Partially Received'].includes(order.status)) {
      return ApiResponse.error(res, 'Order must be Confirmed or Partially Received to receive items', 400);
    }

    const updated = await receiveItems({
      purchaseOrder: order,
      receivedItems,
      userId: req.user._id,
    });

    ApiResponse.success(res, { order: updated }, 'Delivery received');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const deletePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) return ApiResponse.error(res, 'Purchase order not found', 404);
    if (order.status !== 'Draft') {
      return ApiResponse.error(res, 'Only draft orders can be deleted', 400);
    }
    await order.deleteOne();
    ApiResponse.success(res, null, 'Purchase order deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updateStatus,
  receiveDelivery,
  deletePurchaseOrder,
};
