import { query } from '../config/db.js';

export const getAdminDashboardMetrics = async () => {
  // 1. Total active products
  const activeProductsRes = await query(
    'SELECT COUNT(*) as count FROM products WHERE is_active = true;'
  );
  const totalActiveProducts = parseInt(activeProductsRes.rows[0].count, 10);

  // 2. Total registered customers
  const customersRes = await query(
    "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND is_active = true;"
  );
  const totalCustomers = parseInt(customersRes.rows[0].count, 10);

  // 3. Total orders and gross order value
  const ordersSummaryRes = await query(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as gross_order_value,
      COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) as active_order_value
    FROM orders;
  `);
  const ordersSummary = ordersSummaryRes.rows[0];

  // 4. Orders grouped by status
  const ordersByStatusRes = await query(`
    SELECT status, COUNT(*) as count 
    FROM orders 
    GROUP BY status;
  `);
  const ordersByStatus = {
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  ordersByStatusRes.rows.forEach((row) => {
    ordersByStatus[row.status] = parseInt(row.count, 10);
  });

  // 5. Low-stock products (< 10 units)
  const lowStockRes = await query(`
    SELECT p.id, p.sku, p.name, p.stock_quantity, p.unit_price, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true AND p.stock_quantity <= 10
    ORDER BY p.stock_quantity ASC
    LIMIT 10;
  `);

  // 6. Recent 5 orders
  const recentOrdersRes = await query(`
    SELECT 
      o.id, 
      o.order_number, 
      o.total_amount, 
      o.status, 
      o.created_at, 
      u.name as customer_name,
      u.company_name as customer_company
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 5;
  `);

  return {
    metrics: {
      totalActiveProducts,
      totalCustomers,
      totalOrders: parseInt(ordersSummary.total_orders, 10),
      grossOrderValue: Number(Number(ordersSummary.gross_order_value).toFixed(2)),
      activeOrderValue: Number(Number(ordersSummary.active_order_value).toFixed(2)),
      note: 'Values reflect gross placed order amounts, not realized accounting receipts.',
    },
    ordersByStatus,
    lowStockProducts: lowStockRes.rows,
    recentOrders: recentOrdersRes.rows,
  };
};

export const getBusinessReports = async ({ startDate, endDate } = {}) => {
  const params = [];
  const dateClauses = [];

  if (startDate) {
    params.push(startDate);
    dateClauses.push(`created_at >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    dateClauses.push(`created_at <= $${params.length}`);
  }
  const dateSql = dateClauses.length > 0 ? `WHERE ${dateClauses.join(' AND ')}` : '';

  // Order timeline (daily trends)
  const timelineRes = await query(
    `SELECT 
       TO_CHAR(created_at, 'YYYY-MM-DD') as date,
       COUNT(*) as order_count,
       COALESCE(SUM(total_amount), 0) as daily_total
     FROM orders
     ${dateSql}
     GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
     ORDER BY date DESC
     LIMIT 30;`,
    params
  );

  // Top 5 ordered products by quantity
  const topProductsRes = await query(`
    SELECT 
      product_sku, 
      product_name, 
      SUM(quantity) as total_quantity_ordered,
      SUM(line_total) as total_volume_value
    FROM order_items
    GROUP BY product_sku, product_name
    ORDER BY total_quantity_ordered DESC
    LIMIT 5;
  `);

  // Top customers by gross order value
  const topCustomersRes = await query(`
    SELECT 
      u.id, 
      u.name, 
      u.company_name, 
      u.email,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_spend
    FROM users u
    JOIN orders o ON u.id = o.customer_id
    GROUP BY u.id
    ORDER BY total_spend DESC
    LIMIT 5;
  `);

  return {
    timeline: timelineRes.rows,
    topProducts: topProductsRes.rows,
    topCustomers: topCustomersRes.rows,
  };
};

export default {
  getAdminDashboardMetrics,
  getBusinessReports,
};
