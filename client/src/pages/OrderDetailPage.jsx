import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, FileText, MapPin, Calendar, Clock, CheckCircle, Package } from 'lucide-react';

export const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <Loading message="Loading order details..." />;
  if (error || !order) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <Alert type="danger" message={error || 'Order not found'} />
        <Link to="/orders" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
      </div>
    );
  }

  const stages = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStageIndex = stages.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <Link to="/orders" className="btn btn-sm btn-secondary">
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        {order.invoice_id && (
          <Link to={`/invoices/${order.invoice_id}`} className="btn btn-sm btn-primary">
            <FileText size={16} /> View Tax Invoice
          </Link>
        )}
      </div>

      {/* Order Header Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', textTransform: 'uppercase' }}>Commercial Order</span>
            <h2 style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-900)' }}>{order.order_number}</h2>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--neutral-500)', fontSize: '0.85rem', marginTop: '4px' }}>
              <span>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Placed: {new Date(order.created_at).toLocaleString()}
              </span>
              <span>
                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Updated: {new Date(order.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
          <div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Status Lifecycle Indicator */}
        {!isCancelled ? (
          <div style={{ margin: '1.5rem 0', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isPassed ? 'var(--primary-600)' : 'var(--neutral-200)',
                        color: isPassed ? '#ffffff' : 'var(--neutral-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        border: isCurrent ? '3px solid #bfdbfe' : 'none',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isPassed ? 700 : 500,
                        color: isPassed ? 'var(--neutral-900)' : 'var(--neutral-400)',
                        marginTop: '6px',
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="alert alert-danger" style={{ margin: '1rem 0' }}>
            This order has been CANCELLED. All reserved inventory items have been automatically restored to stock.
          </div>
        )}

        {/* Shipping details */}
        <div style={{ background: 'var(--neutral-50)', padding: '1rem', borderRadius: 'var(--radius-md)', margin: '1.25rem 0' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
            <MapPin size={16} color="var(--primary-600)" /> Delivery Destination
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--neutral-700)' }}>{order.shipping_address}</p>
          {order.notes && (
            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginTop: '0.4rem' }}>
              <strong>Requisition Notes:</strong> {order.notes}
            </p>
          )}
        </div>

        {/* Line Items Snapshot */}
        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>Purchased Order Items Snapshot</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name (Snapshot)</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="product-sku">{item.product_sku}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td>INR {Number(item.unit_price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    INR {Number(item.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ maxWidth: '300px', marginLeft: 'auto', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--neutral-600)' }}>Subtotal:</span>
            <span>INR {Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--neutral-600)' }}>GST (18%):</span>
            <span>INR {Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '2px solid var(--neutral-200)',
              fontSize: '1.2rem',
              fontWeight: 800,
            }}
          >
            <span>Total:</span>
            <span>INR {Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
