import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { ArrowLeft, CheckCircle2, ShieldCheck, MapPin, FileText } from 'lucide-react';

export const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('A complete delivery address is required.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/orders', {
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim() || undefined,
      });

      // Refresh cart state (which was cleared on the server)
      await fetchCart();

      // Navigate to confirmation page with created order & invoice data
      navigate('/order-confirmed', {
        state: {
          order: res.data.data.order,
          invoice: res.data.data.invoice,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please review stock availability.');
      setSubmitting(false);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3>No items to checkout</h3>
        <p style={{ color: 'var(--neutral-500)', margin: '1rem 0' }}>Your cart is empty.</p>
        <Link to="/catalog" className="btn btn-primary">
          <ArrowLeft size={16} /> Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <Link to="/cart" className="btn btn-sm btn-secondary" style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft size={16} /> Back to Procurement Cart
      </Link>

      <h1>Review & Confirm Commercial Order</h1>
      <p className="subtitle">Verify line items, recipient facility details, and submit purchase order</p>

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <form onSubmit={handleSubmitOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div>
            {/* Delivery Details */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MapPin size={20} color="var(--primary-600)" /> Delivery Facility & Shipping Destination
              </h3>

              <div className="form-group">
                <label className="form-label">Commercial Entity:</label>
                <input
                  type="text"
                  className="form-input"
                  disabled
                  value={`${user?.company_name || user?.name} (${user?.email})`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Warehouse / Dispatch Address *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter exact facility address, gate number, and contact person"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Procurement Notes / PO Reference (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. PO-2026-Q4-ROBOTICS / Deliver between 9 AM and 5 PM"
                />
              </div>
            </div>

            {/* Line Items Snapshot */}
            <div className="card">
              <h3>Line Items Snapshot ({cart.items.length})</h3>
              <div className="table-responsive" style={{ marginTop: '0.75rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU & Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => (
                      <tr key={item.itemId}>
                        <td>
                          <span className="product-sku">{item.sku}</span>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                        </td>
                        <td>{item.quantity}</td>
                        <td>INR {Number(item.unitPrice).toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          INR {Number(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pricing & Confirmation */}
          <div className="card">
            <h3 style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Final Requisition
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--neutral-600)' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>INR {Number(cart.subtotal).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--neutral-600)' }}>Standard GST (18%):</span>
              <span style={{ fontWeight: 600 }}>INR {Number(cart.taxAmount).toFixed(2)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '2px solid var(--neutral-200)',
                marginTop: '0.75rem',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--neutral-900)',
              }}
            >
              <span>Total Payable:</span>
              <span>INR {Number(cart.totalAmount).toFixed(2)}</span>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '0.85rem',
                background: 'var(--neutral-50)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--neutral-600)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '4px' }}>
                <ShieldCheck size={16} color="var(--primary-600)" /> Transaction Protection
              </div>
              Order submission executes a single PostgreSQL transaction with row locks, guaranteeing inventory integrity.
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem' }}
              disabled={submitting}
            >
              <CheckCircle2 size={18} />
              {submitting ? 'Executing Transaction...' : 'Place Official B2B Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
