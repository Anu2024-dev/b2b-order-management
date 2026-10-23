# Postman API Testing Guide
## B2B Order Management Platform

This guide provides step-by-step instructions for executing and evaluating the complete REST API using Postman.

---

## 1. Files in this Directory

1. `b2b-order-management.postman_collection.json`: Complete collection containing all endpoints organized by domain.
2. `b2b-order-management.postman_environment.json`: Environment template defining `baseUrl`, `customerToken`, `adminToken`, and dynamic entity IDs.

---

## 2. Importing into Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select or drag-and-drop both JSON files:
   - `b2b-order-management.postman_collection.json`
   - `b2b-order-management.postman_environment.json`
4. In the top right environment dropdown, select **"B2B Order Management - Local Dev"**.

---

## 3. Recommended Test Execution Sequence

### Step 1: Health Check
- Run `00. Health & Diagnostics / Health Check`
- Expected Status: `200 OK`
- Verifies that Express server and PostgreSQL 18 are running.

### Step 2: Administrator Login
- Run `01. Authentication / Login as Administrator`
- Body uses:
  ```json
  {
    "email": "admin@arrowdistributors.example.com",
    "password": "AdminSecurePass#2026"
  }
  ```
- **Postman Test Script**: Automatically extracts `data.token` and populates the `adminToken` environment variable.
- Expected Status: `200 OK`

### Step 3: Customer Login
- Run `01. Authentication / Login as Customer`
- Body uses:
  ```json
  {
    "email": "purchasing@apexsolutions.example.com",
    "password": "CustomerSecure#2026"
  }
  ```
- **Postman Test Script**: Automatically extracts `data.token` and populates the `customerToken` environment variable.
- Expected Status: `200 OK`

### Step 4: Catalog & Product Browsing
- Run `03. Products / List Products (with Search & Pagination)`
- Expected Status: `200 OK`
- Notice returned metadata: pagination, active status filter, category links.

### Step 5: Procurement Cart Operations
1. `04. Cart Operations / Get Cart` &rarr; `200 OK`
2. `04. Cart Operations / Add Item to Cart` &rarr; `200 OK` (Recalculates subtotals & taxes on the server)

### Step 6: Placing a B2B Purchase Order
- Run `05. Orders & Invoices / Place Order from Cart`
- Request body sends destination delivery address.
- Expected Status: `201 Created`
- Response returns the created order number (`ORD-YYYYMMDD-XXXX`), line items snapshot, and auto-generated invoice (`INV-YYYYMMDD-XXXX`).

### Step 7: Invoice PDF Download
- Run `05. Orders & Invoices / Download Invoice PDF`
- Postman receives binary stream with `Content-Type: application/pdf`.
- Click **"Save Response &rarr; Save to a file"** to view the generated PDF.

### Step 8: Security & Role Authorization Verifications
1. `07. Security / Unauthorized Access (No Token)` &rarr; `401 Unauthorized`
2. `07. Security / Forbidden Access (Customer Token on Admin Endpoint)` &rarr; `403 Forbidden`
   - Demonstrates server-enforced role separation (preventing privilege escalation).

---

## 4. Key Security Features Demonstrated
- **No Password Leakage**: API responses never return password hashes.
- **Stateless Tokens with Server Revocation**: Logout stores token JTI in `token_revocations`.
- **Row Locking**: Order placement and stock adjustments lock product rows with `SELECT ... FOR UPDATE`.
- **Parameterization**: All database interactions use parameter placeholders `$1, $2` to prevent SQL Injection.
