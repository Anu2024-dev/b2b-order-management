import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAdd = async () => {
    try {
      await addToCart(product.id, quantity);
      setAddedMsg(`Successfully added ${quantity} units to procurement cart!`);
      setTimeout(() => setAddedMsg(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) return <Loading message="Loading product details..." />;
  if (error || !product) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <Alert type="danger" message={error || 'Product not found'} />
        <Link to="/catalog" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const inStock = product.stock_quantity > 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/catalog" className="btn btn-sm btn-secondary" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      {addedMsg && <Alert type="success" message={addedMsg} onClose={() => setAddedMsg('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="product-sku" style={{ fontSize: '0.85rem' }}>
                SKU: {product.sku}
              </span>
              <span className={`stock-status ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                {inStock ? `In Stock (${product.stock_quantity} available)` : 'Currently Out of Stock'}
              </span>
            </div>

            <h1 style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Category: <strong>{product.category_name}</strong>
            </p>

            <div
              style={{
                background: 'var(--neutral-50)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                border: '1px solid var(--neutral-200)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>Contract Unit Price:</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                INR {Number(product.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--neutral-500)', marginLeft: '6px' }}>
                  excl. GST
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Item Description & Technical Specifications</h3>
              <p style={{ color: 'var(--neutral-700)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {product.description || 'Standard industrial grade specification.'}
              </p>
            </div>

            {/* Commercial Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'var(--info-bg)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <ShieldCheck size={18} color="var(--primary-600)" />
                <span>Distributor Verified Quality</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Truck size={18} color="var(--primary-600)" />
                <span>Direct Warehouse Dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <RefreshCw size={18} color="var(--primary-600)" />
                <span>Authoritative Stock Reserved</span>
              </div>
            </div>

            {/* Purchasing action */}
            {isAuthenticated && isCustomer ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Procurement Qty:</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: '90px', textAlign: 'center' }}
                    disabled={!inStock}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  style={{ minWidth: '200px' }}
                  disabled={!inStock}
                  onClick={handleAdd}
                >
                  <ShoppingCart size={18} /> Add to Procurement Cart
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="alert alert-info">
                Please <Link to="/login" style={{ fontWeight: 700, margin: '0 4px' }}>Log In</Link> with a customer account to place orders.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
