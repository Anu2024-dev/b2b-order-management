# REST API Contract & Endpoint Documentation
## Arrowstack Internship — Project 1: B2B Order Management Platform

All endpoints are prefixed with `/api/v1`. JSON is used for all request and response payloads.

---

## 1. Global Response & Error Convention

### Successful Response Format
```json
{
  "success": true,
  "message": "Optional descriptive status message",
  "data": { ... },
  "pagination": { ... } // Optional for list endpoints
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Specific, safe error description",
  "errors": [
    { "field": "email", "message": "Valid business email address is required" }
  ]
}
```

---

## 2. Authentication & Profile Endpoints

### 2.1 Register Customer Account
- **Method**: `POST`
- **URL**: `/api/v1/auth/register`
- **Role Required**: Public (unauthenticated)
- **Rate Limit**: 50 attempts per 15 min
- **Request Body**:
  ```json
  {
    "name": "Rajesh Kumar",
    "email": "purchasing@apexsolutions.example.com",
    "password": "CustomerSecure#2026",
    "companyName": "Apex Manufacturing & Robotics Ltd",
    "phone": "+91 98765 43210",
    "address": "Plot 42, Electronics City Phase 1, Bengaluru, 560100"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Account registered successfully",
    "data": {
      "user": { "id": 2, "name": "Rajesh Kumar", "email": "purchasing@apexsolutions.example.com", "role": "customer", ... },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Errors**: `400 Bad Request` (validation), `409 Conflict` (email already exists).

### 2.2 User Login
- **Method**: `POST`
- **URL**: `/api/v1/auth/login`
- **Role Required**: Public
- **Request Body**:
  ```json
  {
    "email": "purchasing@apexsolutions.example.com",
    "password": "CustomerSecure#2026"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": 2, "email": "purchasing@apexsolutions.example.com", "role": "customer" },
      "token": "eyJhbGciOiJIUzI1Ni..."
    }
  }
  ```
- **Errors**: `401 Unauthorized` (generic "Invalid email or password credentials").

### 2.3 User Logout
- **Method**: `POST`
- **URL**: `/api/v1/auth/logout`
- **Role Required**: `customer` or `admin`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` &mdash; Token JTI is recorded into `token_revocations`.

### 2.4 Get Current User Profile
- **Method**: `GET`
- **URL**: `/api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` &mdash; Returns current profile without password hash.

---

## 3. Product Catalog Endpoints

### 3.1 List Products
- **Method**: `GET`
- **URL**: `/api/v1/products`
- **Role Required**: Public / Customer / Admin
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)
  - `search`: Keyword for name, SKU, or description
  - `category`: Category name string
  - `sort`: `unit_price`, `name`, `stock_quantity`, `created_at` (allowlist validated)
  - `order`: `asc` or `desc`
- **Behavior**: Customers see active products only. Administrators can pass `isActive=false` to view inactive items.

### 3.2 Get Product Details
- **Method**: `GET`
- **URL**: `/api/v1/products/:id`
- **Response**: `200 OK`

### 3.3 Create Product
- **Method**: `POST`
- **URL**: `/api/v1/products`
- **Role Required**: `admin`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "sku": "SKU-ELEC-105",
    "name": "Programmable Logic Controller 24V",
    "description": "Industrial PLC with 14 digital inputs and 10 relay outputs",
    "categoryId": 1,
    "unitPrice": 8500.00,
    "stockQuantity": 20,
    "isActive": true
  }
  ```
- **Response**: `201 Created`

### 3.4 Toggle Product Status
- **Method**: `PATCH`
- **URL**: `/api/v1/products/:id/status`
- **Role Required**: `admin`
- **Request Body**: `{ "isActive": false }`

---

## 4. Procurement Cart Endpoints

### 4.1 Get Cart
- **Method**: `GET`
- **URL**: `/api/v1/cart`
- **Role Required**: `customer`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` &mdash; Computes live subtotal, GST (18%), and verifies current stock.

### 4.2 Add Item to Cart
- **Method**: `POST`
- **URL**: `/api/v1/cart/items`
- **Role Required**: `customer`
- **Request Body**: `{ "productId": 1, "quantity": 5 }`

### 4.3 Update Cart Item
- **Method**: `PATCH`
- **URL**: `/api/v1/cart/items/:itemId`
- **Request Body**: `{ "quantity": 8 }`

### 4.4 Remove Cart Item / Clear Cart
- **Method**: `DELETE /api/v1/cart/items/:itemId`
- **Method**: `DELETE /api/v1/cart`

---

## 5. Orders & Invoices Endpoints

### 5.1 Place Order from Cart
- **Method**: `POST`
- **URL**: `/api/v1/orders`
- **Role Required**: `customer`
- **Request Body**:
  ```json
  {
    "shippingAddress": "Plot 42, Electronics City Phase 1, Hosur Road, Bengaluru, 560100",
    "notes": "PO-2026-Q4-001 Delivery at Gate 2"
  }
  ```
- **Response**: `201 Created` with created order and auto-generated invoice.

### 5.2 List Orders
- **Method**: `GET`
- **URL**: `/api/v1/orders`
- **Role Required**: `customer` (sees own orders) or `admin` (sees all orders).

### 5.3 Advance Order Status
- **Method**: `PATCH`
- **URL**: `/api/v1/orders/:id/status`
- **Role Required**: `admin`
- **Request Body**: `{ "status": "CONFIRMED" }`
- **Permitted Transitions**:
  - `PENDING &rarr; CONFIRMED, CANCELLED`
  - `CONFIRMED &rarr; PROCESSING, CANCELLED`
  - `PROCESSING &rarr; SHIPPED`
  - `SHIPPED &rarr; DELIVERED`

### 5.4 Download Commercial Invoice PDF
- **Method**: `GET`
- **URL**: `/api/v1/invoices/:id/download`
- **Role Required**: `customer` (own invoice) or `admin`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` binary stream with `Content-Type: application/pdf`.

---

## 6. Administration & Reporting Endpoints

### 6.1 Administrator Dashboard Metrics
- **Method**: `GET`
- **URL**: `/api/v1/admin/dashboard`
- **Role Required**: `admin`
- **Response**: `200 OK` &mdash; Returns `totalActiveProducts`, `totalCustomers`, `totalOrders`, `grossOrderValue`, `ordersByStatus`, `lowStockProducts`, `recentOrders`.

### 6.2 Stock Adjustments Ledger
- **Method**: `POST`
- **URL**: `/api/v1/admin/inventory/adjustments`
- **Role Required**: `admin`
- **Request Body**:
  ```json
  {
    "productId": 1,
    "changeQuantity": 50,
    "reason": "RESTOCK_SHIPMENT",
    "referenceId": "PO-ARROW-2026-99"
  }
  ```

### 6.3 Audit Logs Query
- **Method**: `GET`
- **URL**: `/api/v1/admin/audit-logs`
- **Role Required**: `admin`
- **Query Parameters**: `page`, `limit`, `action`, `entityType`.
