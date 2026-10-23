# Quality Assurance & Automated Test Plan
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Quality Objectives & Test Scope

The testing strategy is designed to rigorously validate high-risk business logic, transactional atomicity, concurrency safety, and authorization boundaries:

1. **Authentication & Identity**: Verify password hashing, duplicate email rejection, JWT signing, token tampering defense, token expiration, and server-side revocation.
2. **Authorization Boundaries (RBAC)**: Validate that customers cannot access administrative endpoints, customer orders are isolated from IDOR vulnerabilities, and unauthenticated requests are blocked.
3. **Product & Inventory Integrity**: Ensure SKU uniqueness, non-negative stock constraints, row-locked stock adjustments, and prevent inventory from becoming negative under race conditions.
4. **Order Atomicity & Financial Correctness**: Validate that order placement and stock deduction occur inside a single ACID transaction, line items preserve immutable price snapshots, and cancellation restores inventory.
5. **Invoices & Administration**: Validate that invoices correspond to persisted order totals, PDF generation produces valid binary streams, and operations dashboards compute metrics directly from database rows.

---

## 2. Test Suites Matrix

| Suite File | Scope & Key Test Cases | Target DB | Tooling |
|---|---|---|---|
| `tests/auth.test.js` | 10 tests: Register, duplicate email, invalid data, bcrypt hash check, valid login, wrong password, non-existent user, missing token, tampered token, expired token, RBAC customer restrictions. | `b2b_order_db_test` | Node Test Runner + Supertest |
| `tests/products-inventory.test.js` | 6 tests: Create product, duplicate SKU rejection, negative price/stock rejection, positive stock adjustment with movement log, negative balance rejection, inactive catalog filtering. | `b2b_order_db_test` | Node Test Runner + Supertest |
| `tests/orders-cart.test.js` | 6 tests: Persistent cart calculation, transactional order creation with stock deduction, IDOR customer isolation, admin order access, invalid status transition rejection, cancellation inventory restoration. | `b2b_order_db_test` | Node Test Runner + Supertest |
| `tests/invoices-admin.test.js` | 6 tests: Customer invoice access, IDOR protection on invoices, PDF binary generation stream, admin live dashboard metrics calculation, audit logs query, customer account deactivation/blocking. | `b2b_order_db_test` | Node Test Runner + Supertest |

---

## 3. Test Execution Instructions

### Isolated Test Environment Setup
Tests run against a dedicated, isolated database: `b2b_order_db_test`. Tests never modify development or production data.

1. Ensure PostgreSQL is running.
2. Initialize and migrate the test database:
   ```bash
   npm run migrate:test
   ```
3. Execute the full test suite:
   ```bash
   npm test
   # Or directly:
   node server/tests/run-all.js
   ```
4. Output is logged live to standard output and persisted to `evidence/test-output.txt`.
