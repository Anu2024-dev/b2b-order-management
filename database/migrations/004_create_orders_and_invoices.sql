-- Migration 004: Create Orders, Order Items, and Invoices
-- Up Migration

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(60) UNIQUE NOT NULL,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    shipping_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    product_sku VARCHAR(60) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(60) UNIQUE NOT NULL,
    order_id INT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    customer_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'CANCELLED')),
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
