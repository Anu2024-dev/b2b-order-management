# Automated Test Execution Report & Evidence Summary
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Executive Test Execution Summary

- **Execution Command**: `node server/tests/run-all.js`
- **Execution Date**: October 23, 2026
- **Runtime Environment**: Node.js v22.22.0, PostgreSQL 18.1 (x86_64 Windows), Express.js 4.21.2
- **Target Database**: `b2b_order_db_test`
- **Total Test Suites**: 4
- **Total Tests Executed**: 28
- **Tests Passed**: 28 (100%)
- **Tests Failed**: 0 (0%)
- **Exit Code**: `0`
- **Log Evidence Artifact**: [`evidence/test-output.txt`](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/evidence/test-output.txt)

---

## 2. Detailed Breakdown by Test Suite

### Suite 1: Authentication & Authorization (`tests/auth.test.js`)
- [x] 1. Successfully registers a new customer with hashed password (`250ms`)
- [x] 2. Rejects duplicate email registration with 409 Conflict (`8ms`)
- [x] 3. Rejects invalid registration data with 400 Bad Request (`6ms`)
- [x] 4. Successfully logs in with valid credentials (`115ms`)
- [x] 5. Rejects invalid login password with 401 Unauthorized (`74ms`)
- [x] 6. Rejects non-existent email login with generic 401 Unauthorized (`6ms`)
- [x] 7. Rejects requests without Authorization token with 401 (`5ms`)
- [x] 8. Rejects requests with malformed/tampered JWT token with 401 (`5ms`)
- [x] 9. Rejects expired JWT token with 401 (`7ms`)
- [x] 10. Prevents customer from accessing administrator endpoints with 403 Forbidden (`111ms`)
*Result*: 10/10 Passed.

### Suite 2: Products & Inventory (`tests/products-inventory.test.js`)
- [x] 1. Admin creates a product successfully and logs initial stock movement (`19ms`)
- [x] 2. Rejects duplicate SKU with 409 Conflict (`7ms`)
- [x] 3. Rejects negative price or negative stock with 400 Bad Request (`7ms`)
- [x] 4. Allows admin to adjust inventory positively and records movement ledger (`11ms`)
- [x] 5. Rejects stock deduction exceeding available balance (preventing negative inventory) (`10ms`)
- [x] 6. Deactivated product is hidden from customer product catalog (`14ms`)
*Result*: 6/6 Passed.

### Suite 3: Cart & Orders Transactional (`tests/orders-cart.test.js`)
- [x] 1. Customer adds items to cart and server calculates accurate totals (`100ms`)
- [x] 2. Customer successfully places order in transaction, inventory is deducted atomically (`37ms`)
- [x] 3. Customer B is forbidden from accessing Customer A order details (IDOR protection) (`11ms`)
- [x] 4. Admin can view Customer A order details (`9ms`)
- [x] 5. Rejects invalid order status transition (e.g. PENDING &rarr; DELIVERED directly) (`8ms`)
- [x] 6. Cancelling an order restores inventory back to products with audit movement (`13ms`)
*Result*: 6/6 Passed.

### Suite 4: Invoices & Administration (`tests/invoices-admin.test.js`)
- [x] 1. Customer A can fetch their own invoice (`185ms`)
- [x] 2. Customer B is forbidden from accessing Customer A invoice (`9ms`)
- [x] 3. PDF invoice download generates valid application/pdf stream (`50ms`)
- [x] 4. Admin dashboard endpoint calculates accurate live database metrics (`17ms`)
- [x] 5. Admin audit-logs endpoint retrieves audit records (`13ms`)
- [x] 6. Admin can deactivate and reactivate a customer account (`55ms`)
*Result*: 6/6 Passed.

---

## 3. Defects Identified During Development & Resolutions

1. **Defect 1: Parallel Test File Execution Race Condition**
   - *Symptom*: When `node --test` executed all 4 test files simultaneously, `clearTestData()` in one suite truncated tables while another suite was executing assertions.
   - *Fix*: Added `--test-concurrency=1` to the test runner so suites execute sequentially in isolated phases.

2. **Defect 2: In-Memory Rate Limiting False Positives in Test Environment**
   - *Symptom*: Consecutive integration test requests from IP `127.0.0.1` exceeded the 50-request window of `express-rate-limit`.
   - *Fix*: Modified `rateLimiter.js` to bypass limits when `process.env.NODE_ENV === 'test'`, reserving rate-limiting for development and production modes.

3. **Defect 3: Dotenv Comment Character Parsing**
   - *Symptom*: Passwords containing `#` (e.g. `CustomerSecure#2026`) were truncated at `#` by unquoted `.env` parsing.
   - *Fix*: Quoted all credentials in `.env` and `.env.example` as standard best practice (`"CustomerSecure#2026"`).

---

## 4. Known Untested Areas & Justification

- **High-Concurrency Load Testing (10,000 req/s)**: Not executed in this local environment. While row-level locking was verified with concurrent Supertest requests, high-volume distributed stress testing (e.g., with k6 or JMeter) is scheduled for the Week 4/production readiness phase.
- **Physical Thermal Receipt Printing**: Verified through browser print emulation (`window.print()`) and PDF generation stream; physical hardware printers were not attached.
