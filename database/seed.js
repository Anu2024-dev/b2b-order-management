import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Safety check: Block running seed scripts against a production environment
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
  console.error('[SAFETY ERROR] Seeding demo data is strictly disabled in production.');
  console.error('[SAFETY ERROR] If you genuinely intended to seed demo data in production, set ALLOW_PRODUCTION_SEED=true.');
  process.exit(1);
}

const hasSsl = process.env.DB_SSL === 'true' || Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require'));
const sslConfig = hasSsl
  ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ...(process.env.DB_CA_CERT ? { ca: process.env.DB_CA_CERT } : {}),
    }
  : false;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'b2b_order_db',
      ssl: sslConfig,
    };

const pool = new pg.Pool(poolConfig);

async function seed() {
  console.log('[SEED] Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Categories
    console.log('[SEED] Seeding product categories...');
    const categoriesData = [
      { name: 'Industrial Electronics', description: 'Sensors, microcontrollers, relays, and industrial power supplies' },
      { name: 'Safety & PPE Equipment', description: 'Certified protective helmets, gloves, eye protection, and respirators' },
      { name: 'Precision Fasteners & Hardware', description: 'High-tensile bolts, stainless steel nuts, and structural anchors' },
      { name: 'Heavy-Duty Packaging', description: 'Reinforced corrugated cartons, anti-static bubble rolls, and pallet wraps' },
      { name: 'Pneumatics & Fluid Power', description: 'Air cylinders, pressure regulators, solenoid valves, and polyurethane tubing' }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const res = await client.query(
        `INSERT INTO categories (name, description, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, name;`,
        [cat.name, cat.description]
      );
      categoryMap[cat.name] = res.rows[0].id;
    }

    // 2. Seed Administrator
    console.log('[SEED] Bootstrapping administrator account...');
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@arrowdistributors.example.com';
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'AdminSecurePass#2026';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone, address, is_active)
       VALUES ($1, $2, $3, 'admin', $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = 'admin', is_active = true
       RETURNING id, email, role;`,
      [
        process.env.BOOTSTRAP_ADMIN_NAME || 'Admin Officer',
        adminEmail,
        adminHash,
        process.env.BOOTSTRAP_ADMIN_COMPANY || 'Arrowstack Apex Distribution Pvt Ltd',
        '+91 80 4123 4567',
        '100 Feet Ring Road, BTM 2nd Stage, Bengaluru, Karnataka, 560076'
      ]
    );
    const adminId = adminRes.rows[0].id;

    // 3. Seed Demo Customer
    console.log('[SEED] Seeding demo B2B customer account...');
    const customerEmail = process.env.DEMO_CUSTOMER_EMAIL || 'purchasing@apexsolutions.example.com';
    const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || 'CustomerSecure#2026';
    const customerHash = await bcrypt.hash(customerPassword, 10);

    const customerRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, company_name, phone, address, is_active)
       VALUES ($1, $2, $3, 'customer', $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = 'customer', is_active = true
       RETURNING id, email, role;`,
      [
        process.env.DEMO_CUSTOMER_NAME || 'Rajesh Kumar',
        customerEmail,
        customerHash,
        process.env.DEMO_CUSTOMER_COMPANY || 'Apex Manufacturing & Robotics Ltd',
        '+91 98 7654 3210',
        'Plot 42, Electronics City Phase 1, Hosur Road, Bengaluru, Karnataka, 560100'
      ]
    );
    const customerId = customerRes.rows[0].id;

    // Ensure customer has a cart
    await client.query(
      `INSERT INTO carts (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING;`,
      [customerId]
    );

    // 4. Seed Products
    console.log('[SEED] Seeding realistic B2B products catalog...');
    const productsData = [
      {
        sku: 'SKU-ELEC-101',
        name: 'Industrial DIN-Rail Power Supply 24V 10A 240W',
        description: 'High-efficiency AC-DC power supply with over-voltage, short-circuit, and thermal protection for automation panels.',
        category: 'Industrial Electronics',
        unit_price: 3450.00,
        stock_quantity: 45
      },
      {
        sku: 'SKU-ELEC-102',
        name: 'Photoelectric Diffuse Reflective Sensor M18 (10-30V DC)',
        description: 'IP67 rated optical proximity sensor with 300mm detection range, NPN normally-open output.',
        category: 'Industrial Electronics',
        unit_price: 1850.00,
        stock_quantity: 80
      },
      {
        sku: 'SKU-SAFE-201',
        name: 'ANSI Type II Industrial Safety Helmet with Ratchet Suspension',
        description: 'Vented high-density polyethylene hard hat with 6-point shock absorbing harness and reflective trim.',
        category: 'Safety & PPE Equipment',
        unit_price: 890.00,
        stock_quantity: 120
      },
      {
        sku: 'SKU-SAFE-202',
        name: 'Cut Level 5 Kevlar Reinforced Nitrile Coated Work Gloves (Pack of 12 Pairs)',
        description: 'EN388 compliant anti-abrasion heavy-duty grip gloves for machining and assembly operations.',
        category: 'Safety & PPE Equipment',
        unit_price: 2400.00,
        stock_quantity: 60
      },
      {
        sku: 'SKU-FAST-301',
        name: 'Grade 8.8 High-Tensile Hex Bolt M12 x 50mm (Box of 100)',
        description: 'Zinc-plated medium carbon alloy steel fasteners engineered for heavy mechanical frameworks.',
        category: 'Precision Fasteners & Hardware',
        unit_price: 1450.00,
        stock_quantity: 35
      },
      {
        sku: 'SKU-FAST-302',
        name: 'Stainless Steel 316 Heavy Hex Flange Nut M10 (Box of 200)',
        description: 'Marine-grade corrosion resistant serrated flange locking nuts for chemical and outdoor plants.',
        category: 'Precision Fasteners & Hardware',
        unit_price: 1820.00,
        stock_quantity: 50
      },
      {
        sku: 'SKU-PACK-401',
        name: 'Heavy Duty 5-Ply Corrugated Shipping Boxes 450x300x300mm (Bundle of 25)',
        description: 'Double wall kraft paper carton with 40kg bursting test rating for industrial component freight.',
        category: 'Heavy-Duty Packaging',
        unit_price: 2250.00,
        stock_quantity: 30
      },
      {
        sku: 'SKU-PACK-402',
        name: 'Cast Stretch Film Pallet Wrap 500mm x 300m 23 Micron (Pack of 4 Rolls)',
        description: 'High puncture resistant stretch film with silent unwind for secure palletized cargo unitization.',
        category: 'Heavy-Duty Packaging',
        unit_price: 2600.00,
        stock_quantity: 8 // Low stock for dashboard demonstration!
      },
      {
        sku: 'SKU-PNEU-501',
        name: 'ISO 15552 Standard Pneumatic Air Cylinder 50mm Bore x 100mm Stroke',
        description: 'Double-acting aluminum barrel cylinder with adjustable pneumatic cushioning and magnetic piston ring.',
        category: 'Pneumatics & Fluid Power',
        unit_price: 4200.00,
        stock_quantity: 25
      },
      {
        sku: 'SKU-PNEU-502',
        name: '5/2 Way Solenoid Air Valve G1/4" 24V DC with LED Indicator',
        description: 'Direct-acting directional control valve with internal pilot and manual override pushbutton.',
        category: 'Pneumatics & Fluid Power',
        unit_price: 1950.00,
        stock_quantity: 40
      }
    ];

    const productMap = {};
    for (const p of productsData) {
      const catId = categoryMap[p.category];
      const prodRes = await client.query(
        `INSERT INTO products (sku, name, description, category_id, unit_price, currency, stock_quantity, is_active)
         VALUES ($1, $2, $3, $4, $5, 'INR', $6, true)
         ON CONFLICT (sku) DO UPDATE 
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             category_id = EXCLUDED.category_id,
             unit_price = EXCLUDED.unit_price,
             stock_quantity = EXCLUDED.stock_quantity,
             is_active = true
         RETURNING id, sku, name, unit_price, stock_quantity;`,
        [p.sku, p.name, p.description, catId, p.unit_price, p.stock_quantity]
      );
      productMap[p.sku] = prodRes.rows[0];

      // Initial inventory movement log
      await client.query(
        `INSERT INTO inventory_movements (product_id, change_quantity, balance_after, reason, reference_id, actor_id)
         VALUES ($1, $2, $3, 'INITIAL_SEED', 'SYSTEM_BOOTSTRAP', $4);`,
        [prodRes.rows[0].id, p.stock_quantity, p.stock_quantity, adminId]
      );
    }

    // 5. Seed Initial Sample Order & Invoice for Customer
    console.log('[SEED] Seeding historical sample order and invoice...');
    const orderNumber = 'ORD-2026-10001';
    const existingOrder = await client.query('SELECT id FROM orders WHERE order_number = $1;', [orderNumber]);

    if (existingOrder.rows.length === 0) {
      const item1 = productMap['SKU-ELEC-101'];
      const item2 = productMap['SKU-SAFE-201'];
      const qty1 = 2;
      const qty2 = 5;
      const subtotal = (Number(item1.unit_price) * qty1) + (Number(item2.unit_price) * qty2);
      const taxRate = 0.18; // 18% standard GST for demonstration
      const taxAmount = Number((subtotal * taxRate).toFixed(2));
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));

      const orderRes = await client.query(
        `INSERT INTO orders (order_number, customer_id, subtotal, tax_amount, total_amount, currency, status, shipping_address, notes)
         VALUES ($1, $2, $3, $4, $5, 'INR', 'DELIVERED', $6, $7)
         RETURNING id;`,
        [
          orderNumber,
          customerId,
          subtotal,
          taxAmount,
          totalAmount,
          'Plot 42, Electronics City Phase 1, Hosur Road, Bengaluru, Karnataka, 560100',
          'Initial quarterly maintenance order.'
        ]
      );
      const orderId = orderRes.rows[0].id;

      // Order items snapshots
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_sku, product_name, unit_price, quantity, line_total)
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7),
         ($1, $8, $9, $10, $11, $12, $13);`,
        [
          orderId, item1.id, item1.sku, item1.name, item1.unit_price, qty1, Number(item1.unit_price) * qty1,
          item2.id, item2.sku, item2.name, item2.unit_price, qty2, Number(item2.unit_price) * qty2
        ]
      );

      // Invoice
      const invoiceNumber = 'INV-2026-10001';
      await client.query(
        `INSERT INTO invoices (invoice_number, order_id, customer_id, subtotal, tax_amount, total_amount, currency, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'PAID');`,
        [invoiceNumber, orderId, customerId, subtotal, taxAmount, totalAmount]
      );

      // Audit log for order
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'SEED_SAMPLE_ORDER', 'ORDER', $2, $3);`,
        [customerId, orderId.toString(), JSON.stringify({ order_number: orderNumber, total: totalAmount })]
      );
    }

    // 6. Record System Bootstrap Audit Log
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'SYSTEM_BOOTSTRAP', 'SYSTEM', 'INIT', $2);`,
      [adminId, JSON.stringify({ message: 'Catalog, administrator, and demo customer seeded successfully' })]
    );

    await client.query('COMMIT');
    console.log('[SEED] Database seeding completed successfully!');
    console.log(`[SEED] Admin Login: ${adminEmail} / ${adminPassword}`);
    console.log(`[SEED] Customer Login: ${customerEmail} / ${customerPassword}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED ERROR]', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('[SEED FATAL ERROR]', err);
  process.exit(1);
});
