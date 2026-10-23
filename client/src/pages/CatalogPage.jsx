import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Pagination } from '../components/Pagination';
import { Search, Filter, ShoppingCart, Check, AlertCircle } from 'lucide-react';

export const CatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState({});

  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch {
      // Ignore category load error
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 9,
        sort,
        order,
      };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;

      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort, order]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleAddToCart = async (product) => {
    const qty = quantities[product.id] || 1;
    try {
      await addToCart(product.id, qty);
      setSuccessMsg(`Added ${qty}x ${product.name} to cart`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add product to cart');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>B2B Commercial Catalog</h1>
          <p className="subtitle">High-reliability industrial components and commercial supplies</p>
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by SKU, product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <select
              className="form-select"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <select
              className="form-select"
              value={`${sort}_${order}`}
              onChange={(e) => {
                const [newSort, newOrder] = e.target.value.split('_');
                setSort(newSort);
                setOrder(newOrder);
                setPage(1);
              }}
            >
              <option value="created_at_desc">Newest First</option>
              <option value="unit_price_asc">Price: Low to High</option>
              <option value="unit_price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="stock_quantity_desc">Highest Stock</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
        </form>
      </div>

      {/* Product List */}
      {loading ? (
        <Loading message="Loading product catalog..." />
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="var(--neutral-400)" style={{ margin: '0 auto 1rem' }} />
          <h3>No products found</h3>
          <p style={{ color: 'var(--neutral-500)' }}>
            Try adjusting your search keywords or clearing your active filters.
          </p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((p) => {
              const inStock = p.stock_quantity > 0;
              const isLowStock = inStock && p.stock_quantity <= 10;

              return (
                <div key={p.id} className="product-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="product-sku">{p.sku}</span>
                      <span
                        className={`stock-status ${
                          !inStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'
                        }`}
                      >
                        {!inStock
                          ? 'Out of Stock'
                          : isLowStock
                          ? `Low Stock (${p.stock_quantity})`
                          : `In Stock (${p.stock_quantity})`}
                      </span>
                    </div>

                    <Link to={`/products/${p.id}`}>
                      <h3 className="product-title">{p.name}</h3>
                    </Link>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--neutral-600)',
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.description}
                    </p>

                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                      Category: <strong>{p.category_name}</strong>
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--neutral-200)' }}>
                    <div className="product-price">
                      INR {Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--neutral-500)', marginLeft: '4px' }}>
                        / unit
                      </span>
                    </div>

                    {isAuthenticated && isCustomer ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          max={p.stock_quantity}
                          value={quantities[p.id] || 1}
                          onChange={(e) =>
                            setQuantities({ ...quantities, [p.id]: Math.max(1, parseInt(e.target.value) || 1) })
                          }
                          style={{ width: '70px', padding: '0.4rem', textAlign: 'center' }}
                          disabled={!inStock}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          disabled={!inStock}
                          onClick={() => handleAddToCart(p)}
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                      </div>
                    ) : (
                      <Link
                        to={`/products/${p.id}`}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '0.75rem' }}
                      >
                        View Specifications
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}
    </div>
  );
};

export default CatalogPage;
