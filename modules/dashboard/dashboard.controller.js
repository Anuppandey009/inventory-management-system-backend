const mongoose = require('mongoose');
const Product = require('../product/product.model');
const StockMovement = require('../inventory/inventory.model');
const PurchaseOrder = require('../purchaseOrder/purchaseOrder.model');
const Supplier = require('../supplier/supplier.model');
const ApiResponse = require('../../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.tenantId);

    const [inventoryValue, productCount, supplierCount, pendingPOCount] = await Promise.all([
      Product.aggregate([
        { $match: { tenantId } },
        { $unwind: '$variants' },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$variants.stock', '$variants.costPrice'] } },
            totalRetailValue: { $sum: { $multiply: ['$variants.stock', '$variants.price'] } },
            totalItems: { $sum: '$variants.stock' },
            totalVariants: { $sum: 1 },
          },
        },
      ]),
      Product.countDocuments({ tenantId: req.tenantId }),
      Supplier.countDocuments({ tenantId: req.tenantId }),
      PurchaseOrder.countDocuments({
        tenantId: req.tenantId,
        status: { $in: ['Sent', 'Confirmed', 'Partially Received'] },
      }),
    ]);

    const stats = inventoryValue[0] || { totalValue: 0, totalRetailValue: 0, totalItems: 0, totalVariants: 0 };

    ApiResponse.success(res, {
      inventoryValue: stats.totalValue,
      retailValue: stats.totalRetailValue,
      totalItems: stats.totalItems,
      totalVariants: stats.totalVariants,
      productCount,
      supplierCount,
      pendingPOCount,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStockItems = async (req, res, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.tenantId);

    const lowStockItems = await Product.aggregate([
      { $match: { tenantId } },
      { $unwind: '$variants' },
      {
        $match: {
          $expr: { $lte: ['$variants.stock', '$variants.lowStockThreshold'] },
        },
      },
      {
        $project: {
          productName: '$name',
          category: 1,
          variantId: '$variants._id',
          sku: '$variants.sku',
          attributes: '$variants.attributes',
          stock: '$variants.stock',
          lowStockThreshold: '$variants.lowStockThreshold',
        },
      },
    ]);

    const pendingPOs = await PurchaseOrder.find({
      tenantId: req.tenantId,
      status: { $in: ['Sent', 'Confirmed', 'Partially Received'] },
    });

    const enriched = lowStockItems.map((item) => {
      let pendingQuantity = 0;
      for (const po of pendingPOs) {
        for (const poItem of po.items) {
          if (
            poItem.productId.toString() === item._id.toString() &&
            poItem.variantId.toString() === item.variantId.toString()
          ) {
            pendingQuantity += poItem.quantity - poItem.receivedQuantity;
          }
        }
      }

      return {
        ...item,
        pendingFromPO: pendingQuantity,
        effectiveStock: item.stock + pendingQuantity,
        needsAlert: item.stock + pendingQuantity <= item.lowStockThreshold,
      };
    });

    ApiResponse.success(res, { lowStockItems: enriched });
  } catch (error) {
    next(error);
  }
};

const getTopSellers = async (req, res, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.tenantId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSellers = await StockMovement.aggregate([
      {
        $match: {
          tenantId,
          type: 'sale',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { productId: '$productId', variantSku: '$variantSku' },
          totalSold: { $sum: '$quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          variantSku: '$_id.variantSku',
          totalSold: 1,
        },
      },
    ]);

    ApiResponse.success(res, { topSellers });
  } catch (error) {
    next(error);
  }
};

const getStockMovementGraph = async (req, res, next) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(req.tenantId);
    const days = Number(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const movements = await StockMovement.aggregate([
      {
        $match: {
          tenantId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          total: { $sum: '$quantity' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const graphData = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      graphData[dateStr] = { date: dateStr, purchase: 0, sale: 0, return: 0, adjustment: 0 };
    }

    movements.forEach((m) => {
      if (graphData[m._id.date]) {
        graphData[m._id.date][m._id.type] = m.total;
      }
    });

    ApiResponse.success(res, {
      graph: Object.values(graphData).sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getLowStockItems, getTopSellers, getStockMovementGraph };
