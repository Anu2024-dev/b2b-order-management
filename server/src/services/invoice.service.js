import { query } from '../config/db.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export const getInvoiceById = async (invoiceId, role, userId) => {
  const sql = `
    SELECT 
      inv.id,
      inv.invoice_number,
      inv.order_id,
      inv.customer_id,
      inv.subtotal,
      inv.tax_amount,
      inv.total_amount,
      inv.currency,
      inv.payment_status,
      inv.invoice_date,
      inv.created_at,
      o.order_number,
      o.status as order_status,
      o.shipping_address,
      o.created_at as order_date,
      u.name as customer_name,
      u.email as customer_email,
      u.company_name as customer_company,
      u.phone as customer_phone,
      u.address as customer_address
    FROM invoices inv
    JOIN orders o ON inv.order_id = o.id
    JOIN users u ON inv.customer_id = u.id
    WHERE inv.id = $1;
  `;

  const res = await query(sql, [invoiceId]);
  if (res.rows.length === 0) {
    throw new NotFoundError('Invoice not found');
  }

  const invoice = res.rows[0];

  if (role !== 'admin' && invoice.customer_id !== userId) {
    throw new ForbiddenError('You do not have permission to view this invoice');
  }

  const itemsRes = await query(
    `SELECT id, product_sku, product_name, unit_price, quantity, line_total 
     FROM order_items 
     WHERE order_id = $1 
     ORDER BY id ASC;`,
    [invoice.order_id]
  );

  return {
    ...invoice,
    items: itemsRes.rows,
    distributor: {
      name: 'Arrowstack Apex Distribution Pvt Ltd',
      gstin: '29ABCDE1234F1Z5 (Simulated GSTIN)',
      address: '100 Feet Ring Road, BTM 2nd Stage, Bengaluru, Karnataka, 560076',
      contactEmail: 'billing@arrowdistributors.example.com',
      contactPhone: '+91 80 4123 4567',
      disclaimer: 'This is a computer-generated simulated B2B tax invoice for internship demonstration purposes.',
    },
  };
};

export const getInvoiceByOrderId = async (orderId, role, userId) => {
  const invRes = await query('SELECT id FROM invoices WHERE order_id = $1;', [orderId]);
  if (invRes.rows.length === 0) {
    throw new NotFoundError('No invoice generated for this order');
  }
  return getInvoiceById(invRes.rows[0].id, role, userId);
};

export default {
  getInvoiceById,
  getInvoiceByOrderId,
};
