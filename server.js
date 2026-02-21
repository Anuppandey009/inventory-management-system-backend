const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL } = require('./config/env');
const { initSocket } = require('./utils/socket');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const tenantRoutes = require('./modules/tenant/tenant.routes');
const productRoutes = require('./modules/product/product.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const supplierRoutes = require('./modules/supplier/supplier.routes');
const purchaseOrderRoutes = require('./modules/purchaseOrder/purchaseOrder.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
