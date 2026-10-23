# Architectural & Technical Decision Log (ADR)
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

### Record 1: Relational Database Engine Selection
- **Date**: 2026-10-23
- **Decision**: Select PostgreSQL 18 instead of MongoDB or SQLite.
- **Alternatives Considered**: MongoDB (Mongoose), SQLite.
- **Reason**: The project requirements explicitly demand relational migrations, strict foreign key constraints, numeric financial precision, and row-level locking (`SELECT ... FOR UPDATE`) to eliminate overselling during concurrent order placement. PostgreSQL is the industry benchmark for ACID transactions.
- **Consequences**: Requires a PostgreSQL instance to be initialized locally or via Docker Compose.

---

### Record 2: Monolithic Node.js Service Architecture
- **Date**: 2026-10-23
- **Decision**: Build a modular monolithic Express.js API backend rather than microservices.
- **Alternatives Considered**: Microservices (Auth service, Catalog service, Order service, Billing service).
- **Reason**: Microservices introduce distributed transactions (Saga pattern), network latency, complex local setup, and service discovery overhead. A modular monolith provides clean domain separation with zero operational friction for internship review and automated testing.
- **Consequences**: All domain services reside in `server/src/services/` and share a centralized database connection pool.

---

### Record 3: Server-Authoritative Price Calculation
- **Date**: 2026-10-23
- **Decision**: All line totals, subtotals, and taxes are calculated exclusively on the server from PostgreSQL rows. Client-supplied price amounts in cart or checkout payloads are discarded.
- **Alternatives Considered**: Calculating totals on frontend and validating difference against backend.
- **Reason**: Prevents malicious client tampering where a user modifies prices in browser dev tools or POST requests.
- **Consequences**: Checkout queries PostgreSQL to fetch the latest authorized catalog prices.

---

### Record 4: Order Items Snapshot Isolation Pattern
- **Date**: 2026-10-23
- **Decision**: In `order_items`, store historical snapshot copies of `product_sku`, `product_name`, `unit_price`, and `line_total`.
- **Alternatives Considered**: Referencing `products.id` only and querying the product table dynamically for invoices.
- **Reason**: If a distributor modifies product pricing next month or renames a product, historical purchase orders and tax invoices must remain immutable and legally accurate to the date of transaction.
- **Consequences**: Slight table denormalization in `order_items`, which is the standard commercial design pattern for invoicing systems.

---

### Record 5: Token Revocation Blacklist for Logout
- **Date**: 2026-10-23
- **Decision**: Implement a database `token_revocations` table storing token `jti` and expiry timestamps upon logout.
- **Alternatives Considered**: Stateless deletion only on client; Redis revocation cache.
- **Reason**: Stateless client-side deletion fails to revoke a token if intercepted. Redis would introduce an external dependency. Storing revoked JTIs in PostgreSQL provides immediate revocation enforcement.
- **Consequences**: `auth.js` queries `token_revocations` on each authenticated request. Fast B-tree index on `token_jti` ensures sub-millisecond query overhead.
