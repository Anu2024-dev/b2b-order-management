# Final Project Presentation Slide Outline
## B2B Order Management Platform | Arrowstack Internship Project 1

---

### Slide 1: Title & Executive Introduction
- **Project Title**: B2B Commercial Order Management Platform
- **Developer**: Full Stack Development Intern
- **Internship**: Arrowstack Full Stack 1-Month Internship — Project 1
- **Domain**: B2B Wholesale & Supply Chain Distribution
- **Core Technology Stack**: PostgreSQL 18, Express.js (ES Modules), React 18, Node.js v22

---

### Slide 2: Business Problem & Context
- **The Challenge**: A commercial components distributor relied on unstructured email, phone, and manual spreadsheets to accept high-value purchasing orders.
- **Pain Points**:
  - Unsynchronized catalog stock led to severe overselling.
  - Absence of frozen price snapshots caused post-fulfillment billing disputes.
  - Untracked inventory edits created audit vulnerabilities.
- **Project Goal**: Engineer an enterprise web application providing real-time catalog browsing, atomic order placement, automated invoicing, and compliance tracking.

---

### Slide 3: System Architecture & Separation of Concerns
- **Architecture Style**: Modular Full-Stack Monolith.
- **Frontend**: React 18 SPA with React Router, Context API, and custom enterprise CSS.
- **Backend API**: Express.js REST API with domain service segregation (Auth, Product, Cart, Order, Invoice, Inventory, Audit, Reports).
- **Database**: PostgreSQL 18 with connection pooling and versioned SQL migrations.
- **Security Perimeter**: Helmet headers, origin-restricted CORS, IP rate limiting, and centralized error sanitization.

---

### Slide 4: Database Design & ACID Guarantees
- **Data Integrity**: Full 3NF relational normalization with foreign key cascade/restrict rules.
- **Numeric Precision**: `NUMERIC(12, 2)` eliminates floating-point rounding errors on financial values.
- **Snapshot Isolation Pattern**: Historical `order_items` preserve the SKU, unit price, and line total at the second of checkout, protecting historical orders from future price shifts.
- **Migration Engine**: Custom deterministic runner executing migrations in transaction blocks with rollback protection.

---

### Slide 5: Core Purchasing & Inventory Concurrency Workflow
- **Persistent Cart**: Database-backed cart ensuring seamless cross-device requisitions.
- **Server-Authoritative Pricing**: Frontend inputs are strictly validated; all financial values are computed on the backend.
- **Concurrency Protection**: Checkout executes a single PostgreSQL transaction with row-level locks (`SELECT ... FOR UPDATE`), preventing race conditions and overselling.
- **Cancellation Restitution**: Cancelling an order restores stock atomically and records an `ORDER_CANCEL_RESTORE` ledger event.

---

### Slide 6: Security & Role-Based Authorization
- **Authentication**: Salting and hashing with bcrypt (10 rounds). Passwords are never returned in responses.
- **JWT & Server Revocation**: Access tokens with unique JTI identifiers. Logout records the token into `token_revocations`, neutralizing stolen tokens.
- **RBAC**: Strict server-enforced role gates (`customer` vs `admin`). Customer accounts cannot escalate privileges.
- **Injection Defense**: 100% parameterized queries eliminating SQL injection; sort fields validated against strict allowlists.

---

### Slide 7: Commercial Invoicing & Operations Dashboard
- **Instant Tax Invoice**: Auto-generated upon order completion with unique reference (`INV-YYYYMMDD-XXXX`) and 18% GST breakdown.
- **Dual Delivery**: Printable in-browser view with specialized print stylesheet, plus native binary PDF download via `pdfkit`.
- **Operations Dashboard**: Real-time aggregated metrics computed from database rows (Active items, B2B buyers, Orders by status, Low-stock alerts).
- **Audit Ledger**: Append-only log capturing actor, action, timestamp, entity ID, metadata JSON, and client IP.

---

### Slide 8: Testing & Verification Evidence
- **Automated Test Suite**: 28 automated integration tests executed against isolated test database (`b2b_order_db_test`).
- **Pass Rate**: 100% (28 passed, 0 failed).
- **Postman Deliverables**: Exported collection with pre-configured requests, environment templates, and test scripts.
- **Evidence Files**: Raw test execution logs saved in `evidence/test-output.txt` and live API verification captured in `evidence/live-api-evidence.json`.

---

### Slide 9: Current Limitations & Engineering Roadmap
- **Current Limitations**: Credit-based B2B ordering (no retail payment gateway), single-warehouse allocation, and uniform tax treatment.
- **Scalability (10x)**: Add Redis caching for catalog queries, read-replicas for product browsing, and background BullMQ queues for asynchronous PDF generation.
- **Roadmap Milestones**: Multi-warehouse dispatch routing, tiered bulk volume discounts, and ERP webhook connectors.

---

### Slide 10: Conclusion & Acceptance Sign-off
- **Handbook Compliance**: All 21 functional, architectural, testing, and delivery requirements satisfied.
- **Deliverables**: Complete working codebase, 20 responsive pages, versioned migrations, test suites, Postman collection, Docker Compose config, and technical documentation.
- **Demonstration Ready**: Ready for live mentor review and oral defense (Viva).
