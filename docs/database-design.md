# Relational Database Design & Schema Specification
## Arrowstack Internship — Project 1: B2B Order Management Platform

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CARTS : "owns"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ INVOICES : "billed_to"
    USERS ||--o{ INVENTORY_MOVEMENTS : "authorizes"
    USERS ||--o{ AUDIT_LOGS : "acts_as"
    USERS ||--o{ TOKEN_REVOCATIONS : "revokes"

    CATEGORIES ||--o{ PRODUCTS : "categorizes"

    CARTS ||--o{ CART_ITEMS : "contains"
    PRODUCTS ||--o{ CART_ITEMS : "added_to"

    ORDERS ||--o{ ORDER_ITEMS : "composed_of"
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced_in"
    ORDERS ||--|| INVOICES : "generates"

    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : "tracks"

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role "CHECK ('customer', 'admin')"
        varchar company_name
        varchar phone
        text address
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    CATEGORIES {
        int id PK
        varchar name UK
        text description
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCTS {
        int id PK
        varchar sku UK
        varchar name
        text description
        int category_id FK
        numeric unit_price "CHECK (>= 0)"
        varchar currency "DEFAULT 'INR'"
        int stock_quantity "CHECK (>= 0)"
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    CARTS {
        int id PK
        int user_id FK, UK
        timestamptz updated_at
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity "CHECK (> 0)"
        timestamptz created_at
        timestamptz updated_at
    }

    ORDERS {
        int id PK
        varchar order_number UK
        int customer_id FK
        numeric subtotal "CHECK (>= 0)"
        numeric tax_amount "CHECK (>= 0)"
        numeric total_amount "CHECK (>= 0)"
        varchar currency "DEFAULT 'INR'"
        varchar status "CHECK ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')"
        text shipping_address
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        varchar product_sku "snapshot"
        varchar product_name "snapshot"
        numeric unit_price "snapshot"
        int quantity "CHECK (> 0)"
        numeric line_total "snapshot"
        timestamptz created_at
    }

    INVOICES {
        int id PK
        varchar invoice_number UK
        int order_id FK, UK
        int customer_id FK
        numeric subtotal
        numeric tax_amount
        numeric total_amount
        varchar currency "DEFAULT 'INR'"
        varchar payment_status "CHECK ('PENDING', 'PAID', 'CANCELLED')"
        timestamptz invoice_date
        timestamptz created_at
    }

    INVENTORY_MOVEMENTS {
        int id PK
        int product_id FK
        int change_quantity
        int balance_after "CHECK (>= 0)"
        varchar reason
        varchar reference_id
        int actor_id FK
        timestamptz created_at
    }

    AUDIT_LOGS {
        int id PK
        int actor_id FK
        varchar action
        varchar entity_type
        varchar entity_id
        jsonb metadata
        varchar ip_address
        timestamptz created_at
    }

    TOKEN_REVOCATIONS {
        int id PK
        varchar token_jti UK
        int user_id FK
        timestamptz expires_at
        timestamptz created_at
    }
```

---

## 2. Table Structures & Constraint Justifications

### 2.1 Numeric Precision for Financial Amounts
- **Type**: `NUMERIC(12, 2)` for `unit_price`, `subtotal`, `tax_amount`, and `total_amount`.
- **Justification**: Eliminates binary floating-point rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`) inherent in `FLOAT` or `DOUBLE PRECISION` types, guaranteeing penny-accurate commercial accounting.

### 2.2 Historical Snapshot Isolation
- In `order_items`, the fields `product_sku`, `product_name`, `unit_price`, and `line_total` are recorded at the moment of order placement.
- **Justification**: If an administrator subsequently alters the master product price from INR 1,500 to INR 1,800 or renames the product, historical orders and invoices remain historically true to the transaction contract.

### 2.3 Foreign Key Rules & Integrity
- `products.category_id`: `ON DELETE RESTRICT` &mdash; Prevents deleting a category while active components reference it.
- `orders.customer_id`: `ON DELETE RESTRICT` &mdash; Prevents deleting a customer account if financial records depend on it.
- `cart_items.cart_id`: `ON DELETE CASCADE` &mdash; Clearing a cart safely cascades to its child items.
- `inventory_movements.actor_id`: `ON DELETE SET NULL` &mdash; Preserves stock audit records even if an administrative employee is removed.

---

## 3. Database Indexes

| Table | Index Name | Columns | Purpose |
|---|---|---|---|
| `users` | `idx_users_email` | `email` | Fast lookup during login authentication. |
| `users` | `idx_users_role` | `role` | Rapid filtering of customers vs admins. |
| `products` | `idx_products_sku` | `sku` | Unique lookup and B2B catalog search. |
| `products` | `idx_products_category` | `category_id` | Quick filtering by category. |
| `products` | `idx_products_active` | `is_active` | Rapid retrieval of active catalog items. |
| `orders` | `idx_orders_customer` | `customer_id` | Fast retrieval of user-specific order history. |
| `orders` | `idx_orders_status` | `status` | Operations filtering by fulfillment state. |
| `orders` | `idx_orders_created_at` | `created_at DESC` | Reverse-chronological timeline queries. |
| `inventory_movements` | `idx_inventory_product_id` | `product_id` | Fast ledger lookup per item. |
| `audit_logs` | `idx_audit_logs_actor` | `actor_id` | Compliance filtering by employee/actor. |
| `token_revocations` | `idx_token_revocations_jti` | `token_jti` | Microsecond verification during auth middleware. |

---

## 4. Migration Strategy & Version Control

Migrations are tracked in a dedicated table `schema_migrations`:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- Each `.sql` file in `database/migrations/` executes inside a dedicated transaction block (`BEGIN` / `COMMIT`).
- If any migration encounters a syntax error or constraint conflict, the runner executes `ROLLBACK` and terminates with a non-zero exit code.
- Repeatable seed scripts in `database/seed.js` use `ON CONFLICT (...) DO UPDATE` or `DO NOTHING`, permitting safe re-execution on local development machines without generating duplicates.
