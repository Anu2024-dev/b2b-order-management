# B2B Order Management Platform
## Arrowstack Full Stack Development 1-Month Internship — Project 1

[![Node.js](https://img.shields.io/badge/Node.js-v22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tests](https://img.shields.io/badge/Tests-28%20Passed-brightgreen)](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/evidence/test-output.txt)

---

## 1. Project Overview & Business Scenario

The **B2B Order Management Platform** is a multi-role procurement and fulfillment web application built for a simulated commercial distributor (**Arrowstack Apex Distribution Pvt Ltd**). The platform manages commercial goods, persistent customer purchasing carts, purchase orders, commercial tax invoices, warehouse stock status, and administrative operations.

### Key Business Capabilities
- **Commercial Catalog Exploration**: Real-time browsing of industrial components with category filtering, SKU lookups, and stock indicators.
- **Persistent Procurement Cart**: Cross-session database-backed carts with authoritative server price and tax calculations.
- **ACID Transactional Ordering**: Atomic order placement with row-level locks (`SELECT ... FOR UPDATE`), eliminating overselling during concurrent checkouts.
- **Snapshot Price Immutability**: Historical `order_items` preserve the SKU, unit price, and line totals as contractual records even if master catalog prices change later.
- **Strict Order Status Progression**: Documented lifecycle transitions (`PENDING &rarr; CONFIRMED &rarr; PROCESSING &rarr; SHIPPED &rarr; DELIVERED`), with automated inventory restoration upon order cancellation.
- **Dual Commercial Invoicing**: Browser printable tax invoice with dedicated print stylesheet and on-demand binary PDF generation via `pdfkit`.
- **Live Operations Dashboard & Compliance Trail**: Aggregated metrics computed from database rows and an append-only audit ledger tracking every state mutation.

---

## 2. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, JavaScript, React Router v6, Axios, Lucide React Icons, Custom Enterprise CSS |
| **Backend** | Node.js v22 (ES Modules), Express.js, JWT, bcryptjs, Zod, Helmet, Express Rate Limit, PDFKit |
| **Database** | PostgreSQL 18, `pg` connection pool, Version-Controlled SQL Migrations |
| **Testing** | Node.js Native Test Runner (`node --test`), Supertest, Isolated Test Database |
| **DevOps** | Git, Docker, Docker Compose, dotenv |

---

## 3. Directory Architecture

```
b2b-order-management/
├── client/                     # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── api/                # Axios instance with auth interceptors
│   │   ├── components/         # Navbar, Footer, ProtectedRoute, Modal, etc.
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/              # 20 complete frontend pages
│   │   └── styles/             # Enterprise CSS design system & print styles
│   ├── Dockerfile
│   └── nginx.conf
├── server/                     # Express.js REST API Backend
│   ├── src/
│   │   ├── config/             # Database connection pool & env validation
│   │   ├── controllers/        # Request handling and response formatting
│   │   ├── middleware/         # Auth, RBAC, Zod validation, error handling
│   │   ├── routes/             # REST route modules (/api/v1)
│   │   ├── services/           # Business logic & PostgreSQL transactions
│   │   ├── utils/              # Custom AppError classes
│   │   └── validators/         # Zod schemas for request payloads
│   ├── tests/                  # 4 automated test suites (28 tests)
│   └── Dockerfile
├── database/
│   ├── migrations/             # 5 version-controlled SQL migration scripts
│   ├── migrate.js              # Deterministic transactional migration runner
│   └── seed.js                 # Safe bootstrap script with demo credentials
├── docs/                       # Comprehensive technical documentation
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── api-documentation.md
│   ├── security.md
│   ├── test-plan.md
│   ├── test-results.md
│   ├── decision-log.md
│   ├── work-log.md
│   ├── limitations-and-roadmap.md
│   ├── acceptance-matrix.md
│   ├── final-presentation.md
│   ├── demo-script.md
│   ├── viva-questions.md
│   └── submission-checklist.md
├── postman/                    # Postman collection & environment template
├── evidence/                   # Unedited test output logs and live API data
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+ or v22+)
- PostgreSQL (v14+ or v18+)
- npm (v9+ or v10+)

### Step 1: Clone & Configure Environment Variables
```bash
# In the project root:
cp .env.example .env
```
Ensure your database credentials in `.env` match your local PostgreSQL configuration:
```env
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=b2b_order_db
DB_TEST_NAME=b2b_order_db_test
JWT_SECRET=super_secret_jwt_arrowstack_b2b_development_key_987654321
```

### Step 2: Install All Dependencies
```bash
npm run install:all
```
*(Alternatively: `npm install` in root, `cd server && npm install`, `cd client && npm install`)*

### Step 3: Run Database Migrations
```bash
npm run migrate
```
This executes the 5 SQL migrations in `database/migrations/`, creating all normalized tables, foreign keys, indexes, and constraints.

### Step 4: Seed Initial Data & Demo Accounts
```bash
npm run seed
```
This populates the database with:
- **Administrator**: `admin@arrowdistributors.example.com` / `AdminSecurePass#2026`
- **Customer**: `purchasing@apexsolutions.example.com` / `CustomerSecure#2026`
- 5 Product Categories, 10 B2B Products with SKUs, Initial Inventory Stock, and Historical Order/Invoice.

### Step 5: Start the Development Servers
In separate terminals:
```bash
# Terminal 1: Start Express Backend API (Port 5000)
cd server && npm run dev

# Terminal 2: Start React Frontend (Port 5173)
cd client && npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Automated Testing

The automated test suite runs 28 integration tests against the isolated `b2b_order_db_test` database:
```bash
# Run all tests:
npm test
```
**Actual Verification Outcome**:
- `tests/auth.test.js` &rarr; 10/10 Passed
- `tests/products-inventory.test.js` &rarr; 6/6 Passed
- `tests/orders-cart.test.js` &rarr; 6/6 Passed
- `tests/invoices-admin.test.js` &rarr; 6/6 Passed
- **Total**: 28 passed, 0 failed. Execution logs are stored in `evidence/test-output.txt`.

---

## 6. Docker Deployment

To launch the full stack (PostgreSQL, Backend, Frontend) with persistent volumes:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 7. Internship Deliverables Directory

All required deliverables are completed and located in `docs/`:
- [Business Requirements Specification](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/requirements.md)
- [System Architecture & Component Diagram](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/architecture.md)
- [Database Design & ER Diagram](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/database-design.md)
- [REST API Contract Documentation](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/api-documentation.md)
- [Security Architecture & Controls](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/security.md)
- [Test Plan](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/test-plan.md) & [Actual Test Results](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/test-results.md)
- [Architectural Decision Log (ADR)](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/decision-log.md)
- [Implementation Work Log](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/work-log.md)
- [Limitations & Scalability Roadmap](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/limitations-and-roadmap.md)
- [Requirements Traceability Matrix](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/acceptance-matrix.md)
- [Postman Testing Collection & Environment](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/postman/)
- [5–7 Minute Live Demo Script](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/demo-script.md)
- [Viva Voce Technical Interview Answers](file:///C:/Users/Chetana%20Saha/.gemini/antigravity/scratch/b2b-order-management/docs/viva-questions.md)

---

## 8. License

Developed for academic and evaluation purposes as part of the **Arrowstack Full Stack Development 1-Month Internship**.
