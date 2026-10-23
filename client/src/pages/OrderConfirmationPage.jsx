import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight, Package, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const OrderConfirmationPage = () => {
  const location = useLocation();
  const order = location.state?.order;
  const invoice = location.state?.invoice;

  if (!order) {
    return <Navigate to="/orders" replace />;
  }

  return (
    <div style={{ maxWidth: '750px', margin: '2rem auto' }}>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            background: 'var(--success-bg)',
            color: '#16a34a',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>B2B Order Placed Successfully!</h1>
        <p className="subtitle">
          Your order has been recorded in the central database and stock has been securely reserved.
        </p>

        <div
          style={{
            background: 'var(--neutral-50)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            margin: '1.5rem 0',
            border: '1px solid var(--neutral-200)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Order Number:
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                {order.order_number}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Initial Status:
              </span>
              <div style={{ marginTop: '2px' }}>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--neutral-200)', paddingTop: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Generated Tax Invoice:
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {invoice ? invoice.invoice_number : 'INV-AUTO-GENERATED'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Total Order Value:
              </span>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--neutral-900)' }}>
                INR {Number(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {invoice && (
            <Link to={`/invoices/${invoice.id}`} className="btn btn-primary">
              <FileText size={16} /> View & Print Commercial Invoice
            </Link>
          )}

          <Link to={`/orders/${order.id}`} className="btn btn-secondary">
            View Order Lifecycle
          </Link>

          <Link to="/catalog" className="btn btn-outline">
            Browse More Products
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
