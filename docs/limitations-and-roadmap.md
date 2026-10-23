# Current Limitations, Scalability & Engineering Roadmap
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Current Limitations & Scope Gaps

1. **Simulated B2B Payment Processing**:
   - *Current State*: Orders are submitted as formal purchase requisitions with payment recorded as `PENDING` or marked `PAID` by administrative action.
   - *Limitation*: No direct integration with external payment gateways (Razorpay, Stripe, Net Banking, or e-NACH mandates).
   - *Impact*: Appropriate for enterprise procurement on net-30 credit terms, but unsuitable for direct B2C retail transactions.

2. **Single Distributor Warehouse**:
   - *Current State*: Stock quantities are centralized in a single `products.stock_quantity` column.
   - *Limitation*: Multi-warehouse routing (e.g., dispatching bolts from Bengaluru warehouse and sensors from Pune facility) is not supported.

3. **Tax & Compliance Simplification**:
   - *Current State*: Standard 18% GST calculation applied uniformly across all categories.
   - *Limitation*: Does not calculate state-specific IGST vs CGST/SGST breakdowns or HSN-code tax exemptions.

---

## 2. Security Considerations & Production Hardening Gaps

1. **Token Storage**:
   - *Current*: JWT access tokens are stored in browser `localStorage`.
   - *Production Gap*: Vulnerable to Cross-Site Scripting (XSS) if malicious scripts are injected.
   - *Recommendation*: Migrate to `httpOnly`, `SameSite=Strict`, `Secure` cookies with refresh token rotation.

2. **Revocation Table Vacuuming**:
   - *Current*: Revoked JTIs accumulate indefinitely in `token_revocations`.
   - *Recommendation*: Schedule a PostgreSQL pg_cron task to prune tokens where `expires_at < NOW()`.

3. **Multi-Factor Authentication (MFA)**:
   - *Recommendation*: Require TOTP (Authenticator app) for administrative logins and stock write-offs.

---

## 3. Scaling Strategy (10x & 100x Growth)

If the platform experiences 10x to 100x traffic expansion (from 1,000 to 100,000 daily orders):

### 3.1 Database Read-Replica Pool
- **Bottleneck**: Catalog browsing and search queries dominate traffic (90% reads, 10% writes).
- **Mitigation**: Deploy PostgreSQL streaming replication with one primary (write) instance and two read-replicas. Direct `GET /products` and `GET /categories` queries to read-replicas while routing orders to the primary.

### 3.2 In-Memory Caching (Redis)
- **Bottleneck**: Frequent catalog searches and category lookups hit PostgreSQL disk cache.
- **Mitigation**: Cache catalog queries in Redis with a 5-minute TTL. Invalidate cache tags when an admin updates a product.

### 3.3 Asynchronous Order & Invoice Queue
- **Bottleneck**: PDF generation during checkout consumes CPU cycles.
- **Mitigation**: Offload invoice PDF rendering and dispatch notifications to background BullMQ / Redis workers.

---

## 4. Prioritized Feature Roadmap

| Milestone | Phase | Feature Description | Complexity |
|---|---|---|---|
| **Phase 1** | Immediate | Multi-warehouse inventory allocation & location tracking. | Medium |
| **Phase 2** | Short-Term | Tiered bulk discounting (e.g., 5% off for 100+ units). | Low |
| **Phase 3** | Medium-Term | Payment gateway integration & corporate credit line tracking. | High |
| **Phase 4** | Long-Term | ERP API webhook connectors (SAP S/4HANA & Odoo). | High |
