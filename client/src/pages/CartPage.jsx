import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Loading } from '../components/Loading';
import { ShoppingCart, Trash2, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

export const CartPage = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (loading) return <Loading message="Loading procurement cart..." />;

  const hasItems = cart.items && cart.items.length > 0;
  const hasInvalidItems = cart.items?.some((i) => !i.isAvailable);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Commercial Procurement Cart</h1>
          <p className="subtitle">Review order line items and quantities before submitting requisition</p>
        </div>
        {hasItems && (
          <button className="btn btn-sm btn-secondary" onClick={clearCart}>
            <Trash2 size={16} /> Clear Cart
          </button>
        )}
      </div>

      {!hasItems ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <ShoppingCart size={54} color="var(--neutral-400)" style={{ margin: '0 auto 1rem' }} />
          <h2>Your cart is empty</h2>
          <p style={{ color: 'var(--neutral-500)', marginBottom: '1.5rem' }}>
            Browse the product catalog to add components and commercial materials.
          </p>
          <Link to="/catalog" className="btn btn-primary">
            <ArrowLeft size={16} /> Browse Product Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Items Table */}
          <div className="card">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU & Description</th>
                    <th>Unit Price</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <tr key={item.itemId}>
                      <td>
                        <span className="product-sku">{item.sku}</span>
                        <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                          <Link to={`/products/${item.productId}`}>{item.name}</Link>
                        </div>
                        {item.stockIssue && (
                          <div style={{ color: '#dc2626', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <AlertTriangle size={14} /> {item.stockIssue}
                          </div>
                        )}
                      </td>
                      <td>
                        INR {Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          max={item.stockQuantity}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.itemId, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          style={{ width: '75px', textAlign: 'center', padding: '0.35rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        INR {Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="card">
            <h3 style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Order Price Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--neutral-600)' }}>Subtotal ({cart.itemCount} items):</span>
              <span style={{ fontWeight: 600 }}>
                INR {Number(cart.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              <span style={{ color: 'var(--neutral-600)' }}>Standard GST (18%):</span>
              <span style={{ fontWeight: 600 }}>
                INR {Number(cart.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
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
              <span>Total Requisition:</span>
              <span>
                INR {Number(cart.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.75rem', marginBottom: '1.5rem' }}>
              * Calculated using authoritative database prices and inventory locks upon order placement.
            </p>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={hasInvalidItems}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Review & Order <ArrowRight size={16} />
            </button>

            {hasInvalidItems && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
                Please adjust quantities for items marked with stock warnings before proceeding.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
