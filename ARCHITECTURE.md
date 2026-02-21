# Architecture Document

## Multi-Tenancy Approach: Row-Level Isolation

### Decision
We use **row-level isolation** with a shared database and a `tenantId` field on every document.

### Why This Approach?
| Criterion | Row-Level | Separate DBs | Schema-Based |
|-----------|-----------|--------------|--------------|
| Simplicity | High | Low | Medium |
| Setup cost per tenant | None | High (new DB) | Medium |
| Data isolation | Logical | Physical | Logical |
| Cross-tenant queries | Easy | Very hard | Hard |
| Scaling | Vertical/Horizontal | Per-DB | Per-schema |
| MongoDB compatibility | Native | Native | Not applicable |

**Trade-offs accepted:**
- Slightly weaker isolation vs. separate DBs (mitigated by middleware enforcing tenantId scoping on every query)
- Single-point-of-failure at DB level (mitigated by MongoDB Atlas automatic failover)
- If one tenant has extremely high traffic, it can affect others (mitigated by proper indexing and Atlas auto-scaling)

### How It Works
1. On registration, a `Tenant` document is created and the user gets `role: Owner`.
2. The JWT token contains `tenantId`.
3. The `protect` middleware decodes the JWT and sets `req.tenantId`.
4. The `tenantScope` middleware verifies `tenantId` exists on the request.
5. **Every query** in every controller filters by `tenantId`, ensuring complete data isolation.

## Data Modeling Decisions

### Product Variants (Embedded Array)
Products use an **embedded variants array** rather than a separate collection.

**Why:**
- A product and its variants are always accessed together (no orphan variant queries)
- Atomic updates to product + variants without transactions
- Fewer database round-trips
- MongoDB document size limit (16MB) is more than sufficient for typical variant counts

**Trade-off:** If a product had thousands of variants, a separate collection would be better. For typical retail (< 100 variants per product), embedded is optimal.

### Stock Tracking
Each variant has a `stock` field (current quantity) directly on the product document. All historical movements are stored in a separate `StockMovement` collection for audit trail.

## Concurrency Handling

### Race Condition Prevention
When two users attempt to order the last item simultaneously:

1. We use `findOneAndUpdate` with an atomic `$inc` operator and a **stock floor condition**:
   ```javascript
   Product.findOneAndUpdate(
     { _id: productId, 'variants._id': variantId, 'variants.stock': { $gte: quantity } },
     { $inc: { 'variants.$.stock': -quantity } },
     { new: true }
   )
   ```
2. If the stock condition fails (another user got there first), the update returns `null` and we return an "Insufficient stock" error.
3. MongoDB guarantees this is atomic at the document level - no two concurrent updates can both succeed if only one item remains.

### MongoDB Transactions
For operations that span multiple documents (e.g., receiving a PO delivery updates both the PO document and product stock), we use Mongoose sessions with `startTransaction()` / `commitTransaction()` / `abortTransaction()`.

## Performance Optimization

### Indexing Strategy
All queries are tenant-scoped, so every index is a compound index starting with `tenantId`:

- `Product: { tenantId: 1, name: 1 }` - product search
- `Product: { tenantId: 1, category: 1 }` - category filter
- `Product: { tenantId: 1, 'variants.sku': 1 }` - SKU lookup
- `StockMovement: { tenantId: 1, createdAt: -1 }` - movement log
- `StockMovement: { tenantId: 1, type: 1, createdAt: -1 }` - dashboard top sellers
- `PurchaseOrder: { tenantId: 1, status: 1 }` - PO filtering

### Dashboard Performance
Dashboard queries use MongoDB aggregation pipelines with `$match` on `tenantId` first, leveraging indexes for fast tenant scoping before any `$unwind` or `$group` operations. All four dashboard widgets load in parallel via `Promise.all()`.

### Smart Low-Stock Alerts
Instead of simply checking `stock <= threshold`, we also query pending Purchase Orders for each low-stock variant. If a PO is on its way with enough quantity to cover the deficit, the alert is downgraded to "PO Pending" rather than "Needs Restock".

## Scalability Considerations

1. **Horizontal read scaling**: MongoDB Atlas read replicas for read-heavy dashboard queries
2. **Connection pooling**: Mongoose manages a connection pool (default 100 connections)
3. **Pagination**: All list endpoints use cursor-based pagination (skip/limit) to avoid loading entire collections
4. **Selective population**: `populate()` only selects needed fields (`select: 'name'`) to minimize data transfer

## API Authentication & Authorization

- **JWT tokens** with 7-day expiry stored in localStorage
- Three roles: **Owner** (full access), **Manager** (CRUD on products/suppliers/POs), **Staff** (read-only)
- Role-based middleware (`authorize('Owner', 'Manager')`) applied per-route
- Token refresh not implemented (trade-off: simpler, but users must re-login after 7 days)

## Real-Time Updates

- **Socket.io** with tenant-scoped rooms (`tenant:<tenantId>`)
- Stock change events emitted after successful inventory adjustments
- Frontend subscribes to the tenant room and shows toast notifications
