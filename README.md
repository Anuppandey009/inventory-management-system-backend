# Multi-Tenant Inventory Management System

A full-stack SaaS platform where multiple businesses (tenants) can manage inventory, suppliers, and purchase orders independently with complete data isolation.

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, React Router, Recharts, Socket.io Client
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT Auth, Socket.io
- **Database:** MongoDB Atlas
- **Architecture:** MVC with module-wise folder structure, Row-level multi-tenancy

## Features

- Multi-tenant data isolation (row-level with tenantId)
- Role-based access control (Owner / Manager / Staff)
- Product management with variants (SKU, attributes, pricing, stock per variant)
- Concurrent-safe stock operations (atomic MongoDB updates)
- Full stock movement audit trail (purchase, sale, return, adjustment)
- Supplier management
- Purchase Order lifecycle (Draft -> Sent -> Confirmed -> Partially Received -> Received)
- Partial delivery receiving with automatic stock updates
- Smart low-stock alerts (considers pending Purchase Orders)
- Dashboard with inventory value, top sellers, stock movement graph
- Real-time stock update notifications via Socket.io

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone <repo-url>
cd "Inventory Management system"
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env    # Edit with your MongoDB URI
npm install
npm run seed            # Seed the database with demo data
npm run dev             # Start backend on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Start frontend on http://localhost:5173
```

### 4. Open the app
Navigate to `http://localhost:5173` in your browser.

## Test Credentials

### Tenant 1: TechMart Electronics
| Role | Email | Password |
|------|-------|----------|
| Owner | alice@techmart.com | password123 |
| Manager | bob@techmart.com | password123 |
| Staff | charlie@techmart.com | password123 |

### Tenant 2: Fashion Hub
| Role | Email | Password |
|------|-------|----------|
| Owner | diana@fashionhub.com | password123 |
| Manager | eve@fashionhub.com | password123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/users` - Add team member (Owner only)
- `GET /api/auth/users` - List team members

### Products
- `GET /api/products` - List products (paginated, searchable)
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product with variants
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `GET /api/inventory/movements` - Stock movement log
- `POST /api/inventory/adjust` - Adjust stock (concurrent-safe)

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchase Orders
- `GET /api/purchase-orders` - List POs
- `GET /api/purchase-orders/:id` - Get PO detail
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id` - Update draft PO
- `PATCH /api/purchase-orders/:id/status` - Update PO status
- `POST /api/purchase-orders/:id/receive` - Receive delivery (partial supported)
- `DELETE /api/purchase-orders/:id` - Delete draft PO

### Dashboard
- `GET /api/dashboard/stats` - Overview statistics
- `GET /api/dashboard/low-stock` - Low stock alerts
- `GET /api/dashboard/top-sellers` - Top 5 sellers (30 days)
- `GET /api/dashboard/stock-graph` - Stock movement graph (7 days)

## Project Structure

```
├── backend/
│   ├── config/          # DB connection, environment
│   ├── middleware/       # Auth, tenant scope, role access, errors
│   ├── modules/
│   │   ├── auth/        # User model, auth controller, routes
│   │   ├── tenant/      # Tenant model, controller, routes
│   │   ├── product/     # Product + variant model, CRUD
│   │   ├── inventory/   # Stock movements, concurrent-safe adjustments
│   │   ├── supplier/    # Supplier CRUD
│   │   ├── purchaseOrder/ # PO lifecycle, partial deliveries
│   │   └── dashboard/   # Analytics aggregation queries
│   ├── utils/           # API response helper, Socket.io
│   └── seed/            # Database seeder
├── frontend/
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth & Socket context
│       ├── modules/     # Feature pages
│       └── utils/       # Helper functions
├── ARCHITECTURE.md      # Technical decisions documented
└── README.md
```

## Assumptions & Known Limitations

- Row-level isolation is sufficient for the scope; physical isolation would be needed for regulated industries
- JWT stored in localStorage (HttpOnly cookies would be more secure for production)
- No token refresh mechanism - users must re-login after 7 days
- Search is regex-based; full-text search (Atlas Search) would be better at scale
- No file uploads for product images
- No email notifications for PO status changes

## Time Breakdown

| Task | Time |
|------|------|
| Architecture & planning | 1.5h |
| Backend scaffolding & auth | 2h |
| Product & inventory modules | 3h |
| Supplier & PO modules | 3h |
| Dashboard & analytics | 2h |
| Frontend scaffolding & auth | 1.5h |
| Frontend feature pages | 4h |
| Real-time, seed script, docs | 2h |
| **Total** | **~19h** |
