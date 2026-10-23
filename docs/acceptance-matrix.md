# Requirements Traceability & Acceptance Matrix
## Arrowstack Internship — Project 1: B2B Order Management Platform

This matrix maps every core specification from the Arrowstack Full Stack Internship Handbook to its source file implementation and verification evidence.

---

| Spec ID | Handbook Requirement | Source Implementation | Verification Evidence | Status |
|---|---|---|---|---|
| **REQ-01** | Role-Based Access Control (Customer & Administrator) | `server/src/middleware/role.js`, `server/src/middleware/auth.js` | `tests/auth.test.js` (Test 10), `evidence/live-api-evidence.json` (`forbiddenTest`) | **VERIFIED** |
| **REQ-02** | User Registration, Password Hashing, & JWT Auth | `server/src/services/auth.service.js`, `server/src/controllers/auth.controller.js` | `tests/auth.test.js` (Tests 1–6), `evidence/test-output.txt` | **VERIFIED** |
| **REQ-03** | Server-Side Token Revocation / Logout Blacklist | `server/src/services/auth.service.js`, `token_revocations` table | `tests/auth.test.js` (Test 8 & 9), `evidence/INDEX.md` | **VERIFIED** |
| **REQ-04** | Relational Database with Version-Controlled Migrations | `database/migrations/*.sql`, `database/migrate.js` | Applied 5 migrations on `b2b_order_db` and `b2b_order_db_test` | **VERIFIED** |
| **REQ-05** | Product Catalog Search, Filter, Sort, & Pagination | `server/src/services/product.service.js`, `client/src/pages/CatalogPage.jsx` | `tests/products-inventory.test.js`, browser catalog live testing | **VERIFIED** |
| **REQ-06** | Product Stock & Pricing Integrity (Non-negative, SKU unique) | `server/src/validators/product.validator.js`, PostgreSQL constraints | `tests/products-inventory.test.js` (Tests 2–3) | **VERIFIED** |
| **REQ-07** | Persistent Database-Backed Cart with Server Calculations | `server/src/services/cart.service.js`, `client/src/pages/CartPage.jsx` | `tests/orders-cart.test.js` (Test 1) | **VERIFIED** |
| **REQ-08** | Atomic Order Placement & Row-Level Locking | `server/src/services/order.service.js` (`BEGIN/COMMIT`, `FOR UPDATE`) | `tests/orders-cart.test.js` (Test 2) | **VERIFIED** |
| **REQ-09** | Historical Order Line Item Snapshot Isolation | `order_items` table snapshot fields (`sku`, `unit_price`, `line_total`) | `tests/orders-cart.test.js` (Test 4) | **VERIFIED** |
| **REQ-10** | Order Status Progression Lifecycle (PENDING to DELIVERED) | `server/src/services/order.service.js`, `client/src/pages/OrderAdminPage.jsx` | `tests/orders-cart.test.js` (Test 5) | **VERIFIED** |
| **REQ-11** | Order Cancellation with Inventory Restoration | `server/src/services/order.service.js`, `inventory_movements` | `tests/orders-cart.test.js` (Test 6) | **VERIFIED** |
| **REQ-12** | Commercial Invoicing (View, Print, PDF Download) | `server/src/services/invoice.service.js`, `server/src/services/pdf.service.js` | `tests/invoices-admin.test.js` (Test 3), `client/src/pages/InvoicePage.jsx` | **VERIFIED** |
| **REQ-13** | Operations Dashboard with Live Database Metrics | `server/src/services/report.service.js`, `client/src/pages/AdminDashboardPage.jsx` | `tests/invoices-admin.test.js` (Test 4), `evidence/live-api-evidence.json` | **VERIFIED** |
| **REQ-14** | Business Intelligence Reports with Date Filtering | `server/src/services/report.service.js`, `client/src/pages/ReportsAdminPage.jsx` | Verified via API & UI reports filter | **VERIFIED** |
| **REQ-15** | Append-Only Compliance Audit Logging | `server/src/services/audit.service.js`, `audit_logs` table | `tests/invoices-admin.test.js` (Test 5), `client/src/pages/AuditLogAdminPage.jsx` | **VERIFIED** |
| **REQ-16** | Inventory Ledger & Traceable Movement Tracking | `server/src/services/inventory.service.js`, `inventory_movements` | `tests/products-inventory.test.js` (Test 4), `client/src/pages/InventoryAdminPage.jsx` | **VERIFIED** |
| **REQ-17** | User Management & Account Deactivation | `server/src/controllers/admin.controller.js`, `client/src/pages/UserAdminPage.jsx` | `tests/invoices-admin.test.js` (Test 6) | **VERIFIED** |
| **REQ-18** | Security Hardening (Helmet, CORS, Rate Limit, Input Validation) | `server/src/app.js`, `server/src/middleware/` | `evidence/live-api-evidence.json`, Zod schemas | **VERIFIED** |
| **REQ-19** | 20 Professional Responsive Frontend Pages | `client/src/pages/` (20 component files) | Vite build compiled with 0 errors (`client/dist/`) | **VERIFIED** |
| **REQ-20** | Postman API Test Collection & Environment Template | `postman/` JSON files | `postman/API_TESTING_GUIDE.md` | **VERIFIED** |
| **REQ-21** | Containerized Deployment Configuration | `Dockerfile` (server), `Dockerfile` (client), `docker-compose.yml` | Checked configuration syntax and compose service healthchecks | **VERIFIED** |
