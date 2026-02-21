const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Tenant = require('../modules/tenant/tenant.model');
const User = require('../modules/auth/auth.model');
const Product = require('../modules/product/product.model');
const Supplier = require('../modules/supplier/supplier.model');
const PurchaseOrder = require('../modules/purchaseOrder/purchaseOrder.model');
const StockMovement = require('../modules/inventory/inventory.model');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      StockMovement.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // --- Tenant 1: TechMart ---
    const tenant1 = await Tenant.create({ name: 'TechMart Electronics', slug: 'techmart-electronics' });
    const plainPassword = 'password123';

    const [owner1, manager1, staff1] = await User.create([
      { tenantId: tenant1._id, name: 'Alice Johnson', email: 'alice@techmart.com', password: plainPassword, role: 'Owner' },
      { tenantId: tenant1._id, name: 'Bob Smith', email: 'bob@techmart.com', password: plainPassword, role: 'Manager' },
      { tenantId: tenant1._id, name: 'Charlie Brown', email: 'charlie@techmart.com', password: plainPassword, role: 'Staff' },
    ]);
    tenant1.owner = owner1._id;
    await tenant1.save();

    const products1 = await Product.create([
      {
        tenantId: tenant1._id, name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', category: 'Accessories',
        variants: [
          { sku: 'WM-BLK', attributes: new Map([['color', 'Black']]), price: 29.99, costPrice: 15, stock: 150, lowStockThreshold: 20 },
          { sku: 'WM-WHT', attributes: new Map([['color', 'White']]), price: 29.99, costPrice: 15, stock: 80, lowStockThreshold: 20 },
          { sku: 'WM-BLU', attributes: new Map([['color', 'Blue']]), price: 31.99, costPrice: 16, stock: 5, lowStockThreshold: 15 },
        ],
      },
      {
        tenantId: tenant1._id, name: 'Laptop Stand', description: 'Adjustable aluminum laptop stand', category: 'Accessories',
        variants: [
          { sku: 'LS-SIL-S', attributes: new Map([['color', 'Silver'], ['size', 'Small']]), price: 49.99, costPrice: 25, stock: 60, lowStockThreshold: 10 },
          { sku: 'LS-SIL-L', attributes: new Map([['color', 'Silver'], ['size', 'Large']]), price: 59.99, costPrice: 30, stock: 3, lowStockThreshold: 10 },
          { sku: 'LS-BLK-S', attributes: new Map([['color', 'Black'], ['size', 'Small']]), price: 49.99, costPrice: 25, stock: 45, lowStockThreshold: 10 },
          { sku: 'LS-BLK-L', attributes: new Map([['color', 'Black'], ['size', 'Large']]), price: 59.99, costPrice: 30, stock: 8, lowStockThreshold: 10 },
        ],
      },
      {
        tenantId: tenant1._id, name: 'USB-C Hub', description: '7-in-1 USB-C Hub', category: 'Electronics',
        variants: [
          { sku: 'HUB-7IN1', attributes: new Map([['type', '7-in-1']]), price: 39.99, costPrice: 18, stock: 200, lowStockThreshold: 25 },
          { sku: 'HUB-4IN1', attributes: new Map([['type', '4-in-1']]), price: 24.99, costPrice: 10, stock: 120, lowStockThreshold: 25 },
        ],
      },
      {
        tenantId: tenant1._id, name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', category: 'Accessories',
        variants: [
          { sku: 'KB-RED', attributes: new Map([['switch', 'Red']]), price: 89.99, costPrice: 45, stock: 35, lowStockThreshold: 10 },
          { sku: 'KB-BLUE', attributes: new Map([['switch', 'Blue']]), price: 89.99, costPrice: 45, stock: 42, lowStockThreshold: 10 },
          { sku: 'KB-BROWN', attributes: new Map([['switch', 'Brown']]), price: 89.99, costPrice: 45, stock: 28, lowStockThreshold: 10 },
        ],
      },
      {
        tenantId: tenant1._id, name: 'Monitor 27"', description: '27 inch 4K IPS Monitor', category: 'Electronics',
        variants: [
          { sku: 'MON-27-4K', attributes: new Map([['resolution', '4K']]), price: 399.99, costPrice: 250, stock: 15, lowStockThreshold: 5 },
          { sku: 'MON-27-FHD', attributes: new Map([['resolution', 'FHD']]), price: 249.99, costPrice: 150, stock: 22, lowStockThreshold: 5 },
        ],
      },
    ]);

    const supplier1a = await Supplier.create({
      tenantId: tenant1._id, name: 'Global Tech Supply', email: 'orders@globaltechsupply.com', phone: '+1-555-0101',
      address: '123 Tech Blvd, San Jose, CA 95134',
      products: [
        { productId: products1[0]._id, variantId: products1[0].variants[0]._id, unitPrice: 14 },
        { productId: products1[2]._id, variantId: products1[2].variants[0]._id, unitPrice: 17 },
      ],
    });

    await Supplier.create({
      tenantId: tenant1._id, name: 'KeyboardKing', email: 'sales@keyboardking.com', phone: '+1-555-0102',
      address: '456 Input Way, Austin, TX 73301',
      products: [
        { productId: products1[3]._id, variantId: products1[3].variants[0]._id, unitPrice: 42 },
      ],
    });

    await PurchaseOrder.create({
      tenantId: tenant1._id, orderNumber: 'PO-00001', supplierId: supplier1a._id, createdBy: owner1._id,
      status: 'Confirmed',
      items: [
        { productId: products1[0]._id, variantId: products1[0].variants[2]._id, variantSku: 'WM-BLU', quantity: 50, unitPrice: 15, receivedQuantity: 0 },
        { productId: products1[1]._id, variantId: products1[1].variants[1]._id, variantSku: 'LS-SIL-L', quantity: 30, unitPrice: 28, receivedQuantity: 0 },
      ],
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const now = new Date();
    const movementData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      movementData.push(
        { tenantId: tenant1._id, productId: products1[0]._id, variantId: products1[0].variants[0]._id, variantSku: 'WM-BLK', type: 'sale', quantity: Math.floor(Math.random() * 10) + 1, previousStock: 160, newStock: 150, performedBy: staff1._id, createdAt: date },
        { tenantId: tenant1._id, productId: products1[2]._id, variantId: products1[2].variants[0]._id, variantSku: 'HUB-7IN1', type: 'sale', quantity: Math.floor(Math.random() * 8) + 1, previousStock: 210, newStock: 200, performedBy: staff1._id, createdAt: date },
        { tenantId: tenant1._id, productId: products1[3]._id, variantId: products1[3].variants[1]._id, variantSku: 'KB-BLUE', type: 'sale', quantity: Math.floor(Math.random() * 5) + 1, previousStock: 47, newStock: 42, performedBy: staff1._id, createdAt: date }
      );
    }
    await StockMovement.insertMany(movementData);

    // --- Tenant 2: Fashion Hub ---
    const tenant2 = await Tenant.create({ name: 'Fashion Hub', slug: 'fashion-hub' });

    const [owner2, manager2] = await User.create([
      { tenantId: tenant2._id, name: 'Diana Prince', email: 'diana@fashionhub.com', password: plainPassword, role: 'Owner' },
      { tenantId: tenant2._id, name: 'Eve Wilson', email: 'eve@fashionhub.com', password: plainPassword, role: 'Manager' },
    ]);
    tenant2.owner = owner2._id;
    await tenant2.save();

    const products2 = await Product.create([
      {
        tenantId: tenant2._id, name: 'Classic T-Shirt', description: 'Premium cotton t-shirt', category: 'Clothing',
        variants: [
          { sku: 'TS-S-RED', attributes: new Map([['size', 'S'], ['color', 'Red']]), price: 24.99, costPrice: 8, stock: 100, lowStockThreshold: 20 },
          { sku: 'TS-M-RED', attributes: new Map([['size', 'M'], ['color', 'Red']]), price: 24.99, costPrice: 8, stock: 150, lowStockThreshold: 20 },
          { sku: 'TS-L-RED', attributes: new Map([['size', 'L'], ['color', 'Red']]), price: 24.99, costPrice: 8, stock: 80, lowStockThreshold: 20 },
          { sku: 'TS-S-BLU', attributes: new Map([['size', 'S'], ['color', 'Blue']]), price: 24.99, costPrice: 8, stock: 90, lowStockThreshold: 20 },
          { sku: 'TS-M-BLU', attributes: new Map([['size', 'M'], ['color', 'Blue']]), price: 24.99, costPrice: 8, stock: 12, lowStockThreshold: 20 },
          { sku: 'TS-L-BLU', attributes: new Map([['size', 'L'], ['color', 'Blue']]), price: 24.99, costPrice: 8, stock: 5, lowStockThreshold: 20 },
          { sku: 'TS-S-BLK', attributes: new Map([['size', 'S'], ['color', 'Black']]), price: 24.99, costPrice: 8, stock: 200, lowStockThreshold: 20 },
          { sku: 'TS-M-BLK', attributes: new Map([['size', 'M'], ['color', 'Black']]), price: 24.99, costPrice: 8, stock: 250, lowStockThreshold: 20 },
          { sku: 'TS-L-BLK', attributes: new Map([['size', 'L'], ['color', 'Black']]), price: 24.99, costPrice: 8, stock: 180, lowStockThreshold: 20 },
        ],
      },
      {
        tenantId: tenant2._id, name: 'Denim Jeans', description: 'Slim fit denim jeans', category: 'Clothing',
        variants: [
          { sku: 'DJ-30-BLU', attributes: new Map([['waist', '30'], ['color', 'Blue']]), price: 59.99, costPrice: 22, stock: 60, lowStockThreshold: 15 },
          { sku: 'DJ-32-BLU', attributes: new Map([['waist', '32'], ['color', 'Blue']]), price: 59.99, costPrice: 22, stock: 75, lowStockThreshold: 15 },
          { sku: 'DJ-34-BLU', attributes: new Map([['waist', '34'], ['color', 'Blue']]), price: 59.99, costPrice: 22, stock: 50, lowStockThreshold: 15 },
          { sku: 'DJ-30-BLK', attributes: new Map([['waist', '30'], ['color', 'Black']]), price: 59.99, costPrice: 22, stock: 40, lowStockThreshold: 15 },
          { sku: 'DJ-32-BLK', attributes: new Map([['waist', '32'], ['color', 'Black']]), price: 59.99, costPrice: 22, stock: 55, lowStockThreshold: 15 },
        ],
      },
      {
        tenantId: tenant2._id, name: 'Canvas Sneakers', description: 'Casual canvas sneakers', category: 'Footwear',
        variants: [
          { sku: 'CS-8-WHT', attributes: new Map([['size', '8'], ['color', 'White']]), price: 44.99, costPrice: 18, stock: 30, lowStockThreshold: 10 },
          { sku: 'CS-9-WHT', attributes: new Map([['size', '9'], ['color', 'White']]), price: 44.99, costPrice: 18, stock: 25, lowStockThreshold: 10 },
          { sku: 'CS-10-WHT', attributes: new Map([['size', '10'], ['color', 'White']]), price: 44.99, costPrice: 18, stock: 8, lowStockThreshold: 10 },
        ],
      },
    ]);

    await Supplier.create({
      tenantId: tenant2._id, name: 'Fabric World', email: 'orders@fabricworld.com', phone: '+1-555-0201',
      address: '789 Fashion Ave, New York, NY 10018',
      products: [
        { productId: products2[0]._id, variantId: products2[0].variants[0]._id, unitPrice: 7 },
        { productId: products2[1]._id, variantId: products2[1].variants[0]._id, unitPrice: 20 },
      ],
    });

    console.log('\n=== Seed Complete ===');
    console.log('\nTenant 1: TechMart Electronics');
    console.log('  Owner:   alice@techmart.com / password123');
    console.log('  Manager: bob@techmart.com / password123');
    console.log('  Staff:   charlie@techmart.com / password123');
    console.log('\nTenant 2: Fashion Hub');
    console.log('  Owner:   diana@fashionhub.com / password123');
    console.log('  Manager: eve@fashionhub.com / password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
