# System Architecture & Technical Design
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Architecture Overview

The system is architected as a **Modular Full-Stack Monolith**, segregating concerns into a responsive Single Page Application (SPA) frontend, an Express.js REST API layer with domain services, and a relational PostgreSQL database.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 18 + Vite)"]
        SPA["React SPA (React Router, Axios, Context API)"]
        PrintEngine["Print CSS & Invoice Viewer"]
    end

    subgraph APILayer ["Backend API Layer (Express.js ES Modules)"]
        Middleware["Security & Middleware (Helmet, CORS, Rate Limit, Auth, RBAC, Zod Validate)"]
        Routers["REST Route Handlers (/api/v1)"]
        Services["Domain Services (Order, Inventory, Cart, Product, Audit, Invoice, PDF)"]
        PDFGen["PDFKit Generator Stream"]
    end

    subgraph DataLayer ["Database Layer (PostgreSQL 18)"]
        Pool["pg.Pool Connection Pool"]
        Tables[("Normalized PostgreSQL Tables & Views")]
        AuditLedger[("Append-Only Audit & Movement Ledgers")]
    end

    SPA -->|HTTPS / JSON REST API| Middleware
    Middleware --> Routers
    Routers --> Services
    Services --> PDFGen
    Services --> Pool
    Pool --> Tables
    Pool --> AuditLedger
    PDFGen -->|Binary PDF Stream| SPA
```

---

## 2. Request Processing & Security Pipeline

Each incoming HTTP request traverses a hardened middleware pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Customer / Admin Browser
    participant H as Helmet & CORS
    participant RL as Rate Limiter
    participant Val as Zod Validation Middleware
    participant Auth as Auth & RBAC Middleware
    participant Ctrl as Route Controller
    participant Svc as Domain Service
    participant DB as PostgreSQL 18

    Client->>H: HTTP Request (Method, URL, Headers)
    H->>RL: Check IP Rate Limit
    RL->>Val: Check Request Body / Query Schema
    alt Validation Failure
        Val-->>Client: 400 Bad Request (Formatted Field Errors)
    end
    Val->>Auth: Verify JWT Token & Role Permissions
    alt Missing / Invalid Token
        Auth-->>Client: 401 Unauthorized
    else Insufficient Role Permission
        Auth-->>Client: 403 Forbidden
    end
    Auth->>Ctrl: Forward req.user & parsed params
    Ctrl->>Svc: Invoke business operation
    Svc->>DB: Execute parameterized query or transaction
    DB-->>Svc: Returned rows
    Svc-->>Ctrl: Service result
    Ctrl-->>Client: 200/201 JSON Response ({ success: true, data: ... })
```

---

## 3. Order Placement & Transaction Concurrency Flow

To guarantee zero overselling when multiple buyers place simultaneous orders targeting shared inventory, the order placement workflow employs PostgreSQL row-level locks within a strict ACID transaction:

```mermaid
flowchart TD
    Start([POST /api/v1/orders]) --> AuthCheck{Customer Authenticated?}
    AuthCheck -- No --> Ret401[Return 401 Unauthorized]
    AuthCheck -- Yes --> BeginTx[BEGIN PostgreSQL Transaction]
    BeginTx --> FetchCart[Retrieve cart items for user]
    FetchCart --> EmptyCartCheck{Is cart empty?}
    EmptyCartCheck -- Yes --> Rollback1[ROLLBACK & Return 400 Bad Request]
    EmptyCartCheck -- No --> LockProducts["SELECT ... FROM products WHERE id = ANY(items) FOR UPDATE"]
    LockProducts --> StockValidation{All products active & stock >= requested?}
    StockValidation -- No --> Rollback2[ROLLBACK & Return 400 Insufficient Stock]
    StockValidation -- Yes --> InsertOrder["INSERT INTO orders (subtotal, tax, total, status='PENDING')"]
    InsertOrder --> InsertSnapshots["INSERT INTO order_items (preserves sku, name, unit_price snapshots)"]
    InsertSnapshots --> DeductStock["UPDATE products SET stock_quantity = stock - qty"]
    DeductStock --> LogMovement["INSERT INTO inventory_movements (reason='ORDER_DEDUCTION')"]
    LogMovement --> GenInvoice["INSERT INTO invoices (invoice_number, order_id, status='PENDING')"]
    GenInvoice --> ClearCart["DELETE FROM cart_items WHERE cart_id = cartId"]
    ClearCart --> LogAudit["INSERT INTO audit_logs (action='ORDER_PLACED')"]
    LogAudit --> CommitTx[COMMIT Transaction]
    CommitTx --> Ret201[Return 201 Created with Order & Invoice Payload]
```

---

## 4. Key Architectural Trade-offs & Decisions

1. **Modular Monolith vs Microservices**:
   - *Decision*: Adopted a single modular Express monolith instead of decoupled microservices.
   - *Rationale*: For an internship project, a monolith simplifies local evaluation, deterministic migration testing, atomic relational transactions, and CI/CD without the operational overhead of service meshes or distributed transactions.

2. **Server-Side Price Calculation**:
   - *Decision*: Client-supplied prices and subtotals are completely ignored. All line prices, taxes, and totals are fetched authoritatively from PostgreSQL.
   - *Rationale*: Eliminates client-side tampering vulnerabilities where a user could manipulate the browser DOM or Axios payload to purchase goods at arbitrary rates.

3. **Row-Level Locking (`SELECT FOR UPDATE`)**:
   - *Decision*: Product records are locked exclusively during cart checkout.
   - *Rationale*: Eliminates race conditions in high-demand catalog scenarios where two buyers attempt to purchase the final remaining units concurrently.
