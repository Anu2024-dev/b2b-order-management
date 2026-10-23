# Evidence Index & Verification Artifacts
## Arrowstack Internship — Project 1: B2B Order Management Platform

This directory contains unedited, verifiable evidence of automated test results, runtime checks, database operations, and live REST API responses.

---

## 1. Automated Test Execution Evidence
- **File**: [`test-output.txt`](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/evidence/test-output.txt)
- **Suite Command**: `node server/tests/run-all.js`
- **Total Tests Executed**: 28
- **Passed**: 28 (100%)
- **Failed**: 0
- **Suites Executed**:
  1. `Authentication & Authorization Suite` (10 tests)
  2. `Invoices & Administration Suite` (6 tests)
  3. `Cart & Orders Transactional Suite` (6 tests)
  4. `Products & Inventory Suite` (6 tests)

---

## 2. Live API Execution & Security Evidence
- **File**: [`live-api-evidence.json`](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/evidence/live-api-evidence.json)
- **Captured Live Endpoints**:
  1. `/api/v1/health` &rarr; Database connection, system uptime, and server timestamp.
  2. `/api/v1/products?limit=2` &rarr; Category joins, formatted monetary prices, pagination metadata.
  3. `/api/v1/auth/login` (Customer) &rarr; Safe user profile payload without password hashes, issued JWT.
  4. `/api/v1/auth/login` (Admin) &rarr; Administrator credential verification.
  5. `/api/v1/admin/dashboard` &rarr; Aggregated order metrics, status breakdown, and low stock warnings.
  6. `/api/v1/auth/me` &rarr; Authenticated session profile retrieval.
  7. **Security Verification 1 (Unauthorized)**: Missing Authorization token produces HTTP `401 Unauthorized`.
  8. **Security Verification 2 (Forbidden / RBAC)**: Customer token sent to administrative endpoint produces HTTP `403 Forbidden` (`Access denied: insufficient permissions`).

---

## 3. Database Migration & Schema Verification
- **Migrations Applied**: 5 versioned SQL migrations (`001` through `005`).
- **Target Databases**: `b2b_order_db` (development), `b2b_order_db_test` (isolated integration testing).
- **Migration Tracking Table**: `schema_migrations` records execution timestamps for all `.sql` scripts deterministically.
