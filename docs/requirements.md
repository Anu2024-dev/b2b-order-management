# Business Requirements & Specification
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Executive Summary & Business Problem

A mid-tier simulated commercial distributor (**Arrowstack Apex Distribution Pvt Ltd**) supplies components across industrial automation, safety equipment, precision fasteners, and packaging materials. Previously, customer purchase requisitions were processed manually via unstructured phone calls, paper slips, and informal spreadsheets. 

This manual process resulted in:
1. **Overselling & Stock Discrepancies**: Customers placed orders for out-of-stock items, resulting in delayed fulfillment.
2. **Pricing Disputes**: Absence of immutable price snapshots allowed historical orders to be disputed if catalog prices fluctuated.
3. **Audit Inefficiencies**: Administrative inventory edits lacked traceable actor tracking and justification records.
4. **Billing Inconsistencies**: Delayed commercial invoice generation impeded customer payment cycles.

The objective of Project 1 is to engineer a centralized, multi-role B2B Order Management Platform that standardizes catalog exploration, cart management, atomic inventory reservation, order lifecycle progression, invoice issuance, and compliance logging.

---

## 2. Primary Stakeholders

1. **Procurement Purchasing Officer (Customer)**:
   - Registers their commercial business entity.
   - Searches and filters the product catalog by category, SKU, and price.
   - Adds available inventory to a persistent procurement cart.
   - Submits formal purchase orders with destination facility addresses.
   - Tracks order status and accesses downloadable tax invoices.

2. **Fulfillment Operations Manager (Administrator)**:
   - Manages catalog items, specifications, and categories.
   - Executes authorized inventory adjustments with documented justification.
   - Advances customer orders through an explicit status lifecycle: `PENDING &rarr; CONFIRMED &rarr; PROCESSING &rarr; SHIPPED &rarr; DELIVERED`.
   - Audits system-wide mutation logs and oversees business activity dashboards.

3. **Technical Mentor / Evaluation Auditor**:
   - Assesses adherence to relational database normalization, transactions, versioned migrations, security postures, automated test coverage, and documentation standards.

---

## 3. Assumptions & Scope Boundaries

### In-Scope Functional Modules
- **Authentication & RBAC**: JWT-based session management, bcrypt password hashing, role enforcement (`customer` vs `admin`), and session token revocation.
- **Product Catalog & Inventory**: Searchable catalog, SKU uniqueness, non-negative quantity constraints, and row-locked stock adjustments.
- **Persistent Cart & Atomic Orders**: Database-backed cart, authoritative server pricing calculation, PostgreSQL transaction protection with row locking (`SELECT ... FOR UPDATE`), order snapshot immutability, and stock restoration on cancellation.
- **Commercial Invoicing**: Unique invoice generation (`INV-YYYYMMDD-XXXX`), 18% standard GST calculation, printable browser layout, and binary PDF generation via `pdfkit`.
- **Administrative Operations & Audit**: Live operations dashboard metrics, daily order intake reports, client spend rankings, user activation toggling, and append-only audit trail logging.

### Explicit Scope Boundaries & Exclusions
- **No Real Payment Gateway**: In an enterprise B2B context, orders are submitted as formal requisitions with invoice settlement through credit terms, simulated checks, or bank transfers. No third-party payment gateway (Stripe/Razorpay) is integrated.
- **No Direct ERP Synchronization**: While architected with clean service boundaries, real-time sync with SAP/Oracle is excluded in this MVP.
- **Simulated Tax Treatment**: Standard 18% GST is applied for demonstration; complex multi-jurisdictional tax exemptions are excluded.

---

## 4. Measurable Acceptance Criteria

| ID | Category | Requirement Description | Verification Method |
|---|---|---|---|
| **AC-01** | Setup | Fresh database can initialize and apply all SQL migrations deterministically. | `npm run migrate` & migration tracking table inspection. |
| **AC-02** | Auth | Safe customer registration, bcrypt hashing, and JWT issuance with 0 password leakage in responses. | Unit & integration tests in `tests/auth.test.js`. |
| **AC-03** | Security | Enforce server-side role separation; unauthenticated and unauthorized requests rejected with 401/403. | Supertest API tests & live curl execution. |
| **AC-04** | Catalog | SKU uniqueness, non-negative unit prices, active status filtering for customers. | Supertest API tests in `tests/products-inventory.test.js`. |
| **AC-05** | Cart | Server calculates subtotal and taxes authoritatively; ignores client-supplied totals. | Automated testing in `tests/orders-cart.test.js`. |
| **AC-06** | Orders | Order creation and stock deduction execute in a single PostgreSQL transaction with row-level locks. | Concurrent order test & transaction rollback assertions. |
| **AC-07** | Inventory | Stock cannot become negative; cancellation restores reserved quantities. | `tests/orders-cart.test.js` & `tests/products-inventory.test.js`. |
| **AC-08** | Invoices | Stable invoice generated per order; binary PDF download stream functional. | `tests/invoices-admin.test.js`. |
| **AC-09** | Audit | Sensitive mutations record actor ID, action name, entity ID, metadata JSON, and IP. | Audit table inspection and API tests. |
| **AC-10** | Frontend | 20 fully functional, responsive React pages with no broken links or mock-only actions. | React Vite production build & live browser evaluation. |
