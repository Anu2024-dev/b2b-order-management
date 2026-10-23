# Technical Interview & Viva Voce Preparation Guide
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

### Theme 1: Business Value & Domain Problem
**Question**: What business problem does this project solve, and what tangible benefits does it deliver to a commercial distributor?
**Answer**:
"In industrial wholesale, procurement typically occurs via unstructured emails, paper POs, and phone calls. This introduces three major points of operational failure:
1. **Overselling**: Orders are accepted for out-of-stock items, stalling manufacturing lines.
2. **Pricing Disputes**: Post-fulfillment disputes arise when catalog prices change between quotation and invoicing.
3. **Audit Blindness**: Manual stock adjustments lack accountability.

Our platform provides a centralized, multi-role portal. It delivers server-authoritative pricing, eliminates overselling through row-locked database transactions, preserves immutable order item snapshots, and maintains an append-only compliance audit trail. The business benefits are traceable accountability, automated tax invoicing, and near-zero order placement discrepancies."

---

### Theme 2: Major Architectural & Database Design Decisions
**Question**: Why did you choose a relational database (PostgreSQL) over a NoSQL database (MongoDB), and what schema patterns did you employ?
**Answer**:
"We selected PostgreSQL 18 because enterprise B2B order management is inherently relational and strictly requires ACID transaction guarantees.
Specifically:
1. **Financial Integrity**: We use `NUMERIC(12, 2)` for monetary values, eliminating the floating-point rounding errors common in MongoDB's default BSON floating-point representation.
2. **Snapshot Isolation Pattern**: In `order_items`, we duplicate the SKU, product name, unit price, and line total at checkout. If an administrator later alters catalog prices or deactivates a product, historical invoices and accounting records remain unchanged.
3. **Referential Integrity**: We enforce foreign key rules (`ON DELETE RESTRICT` for categories and orders) to prevent accidental cascading deletion of historical business records."

---

### Theme 3: Data Validation & Input Sanitization
**Question**: How does the platform protect against bad inputs, malicious payloads, and SQL injection?
**Answer**:
"We enforce a multi-tier validation architecture:
1. **Schema Validation**: All incoming request bodies and query parameters pass through strict **Zod** schemas in middleware before reaching any controller. For example, during registration, client attempts to pass `"role": "admin"` are discarded, preventing mass assignment and privilege escalation.
2. **SQL Injection Defense**: We use 100% parameterized queries (`$1, $2, $3`) via `pg`. User input is never concatenated into raw SQL strings.
3. **Allowlist Sorting**: For product catalog sorting, fields are checked against an explicit allowlist (`['name', 'unit_price', 'created_at', 'stock_quantity']`). Any unrecognized field defaults to `created_at`."

---

### Theme 4: Edge Cases & Concurrency Handling
**Question**: What happens if two customers try to purchase the final remaining units of an item at the exact same millisecond?
**Answer**:
"We prevent overselling using **PostgreSQL row-level locks** within an explicit ACID transaction.
In `order.service.js`, checkout queries the requested products with:
```sql
SELECT id, sku, name, unit_price, stock_quantity, is_active 
FROM products 
WHERE id = ANY($1) 
FOR UPDATE;
```
The first transaction acquires an exclusive row lock. The second transaction is queued. Once the first transaction verifies stock, deducts inventory, and commits, the second transaction acquires the lock, inspects the updated `stock_quantity`, recognizes that available stock is insufficient, and executes a clean `ROLLBACK` with an HTTP `400 Insufficient Stock` error. Inventory can never drop below zero."

---

### Theme 5: 10x Scaling & Architectural Evolution
**Question**: How would you scale this architecture if daily order volume grows from 1,000 to 100,000?
**Answer**:
"To handle a 100x traffic surge without degrading performance:
1. **Read/Write Splitting**: Since catalog browsing accounts for ~90% of requests, we would implement PostgreSQL streaming replication. Catalog search (`GET /products`) would be served by read-replicas, while write operations (`POST /orders`) target the primary node.
2. **In-Memory Caching (Redis)**: Cache active categories and product listings in Redis with cache invalidation hooks triggered by product updates.
3. **Asynchronous Queuing**: Move CPU-heavy operations like PDF invoice generation and order confirmation emails to background workers using BullMQ and Redis, keeping API response latency under 50ms."

---

### Theme 6: Explaining the Solution to a Non-Technical Stakeholder
**Question**: How would you explain the value of this platform to a warehouse operations manager who is skeptical of digital systems?
**Answer**:
"I would explain it through their day-to-day pain points:
'Right now, your warehouse team frequently receives orders for items that were already promised to someone else earlier that morning, leading to angry customer calls and emergency rush orders. 

With this system, the moment a buyer clicks "Order", the system instantly reserves those specific items in the database. No other customer can order them, and your team immediately sees a confirmed dispatch ticket with an official tax invoice already attached. If an order is ever cancelled, the items are automatically put back into your available count without anyone having to manually update a spreadsheet.'"

---

### Theme 7: Most Challenging Technical Trade-off
**Question**: What was the most difficult technical decision you faced during implementation, and how did you resolve it?
**Answer**:
"The most nuanced challenge was **session logout with stateless JWTs**. Standard stateless JWTs cannot be revoked from the server side without a database check. If a stolen token is deleted on the client, the token remains valid until expiration.

We solved this by giving each JWT a unique cryptographic UUID (`jti`). When a user logs out, the backend records that `jti` in a `token_revocations` table. Our `auth.js` middleware checks this table on each request. To prevent performance degradation, `token_revocations` has a high-speed B-tree index on `token_jti`, keeping check overhead under 1 millisecond while ensuring absolute security against hijacked tokens."
