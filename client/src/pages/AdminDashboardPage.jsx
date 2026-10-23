import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Boxes,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load administrator dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loading message="Computing real-time operations metrics..." />;
  if (error || !data) return <Alert type="danger" message={error || 'Failed to load metrics'} />;

  const { metrics, ordersByStatus, lowStockProducts, recentOrders } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Operations Administrator Dashboard</h1>
          <p className="subtitle">Real-time inventory metrics, order volume, and fulfillment workflows</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/admin/inventory" className="btn btn-sm btn-secondary">
            <Boxes size={16} /> Manage Stock
          </Link>
          <Link to="/admin/orders" className="btn btn-sm btn-primary">
            <ShoppingCart size={16} /> Fulfillment Queue
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-outline"
            style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.4)' }}
            title="Log out of administrator session"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Package size={24} />
          </div>
          <div className="metric-info">
            <h4>Active Products</h4>
            <div className="metric-value">{metrics.totalActiveProducts}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Users size={24} />
          </div>
          <div className="metric-info">
            <h4>B2B Customers</h4>
            <div className="metric-value">{metrics.totalCustomers}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="metric-info">
            <h4>Total Orders</h4>
            <div className="metric-value">{metrics.totalOrders}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <TrendingUp size={24} />
          </div>
          <div className="metric-info">
            <h4>Gross Order Value</h4>
            <div className="metric-value">
              INR {Number(metrics.grossOrderValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: '1.5rem', background: 'var(--neutral-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
        * <strong>Reporting Disclaimer:</strong> {metrics.note}
      </div>

      {/* Status Breakdown Grid */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Requisition Lifecycle Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <div
              key={status}
              style={{
                background: 'var(--neutral-50)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                border: '1px solid var(--neutral-200)',
              }}
            >
              <StatusBadge status={status} />
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--neutral-900)' }}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column: Low Stock Alerts and Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} color="#d97706" /> Critical Low-Stock Items (&le; 10 units)
            </h3>
            <Link to="/admin/inventory" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Adjust Stock &rarr;
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
              All inventory levels are currently above threshold.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>SKU & Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Stock Left</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="product-sku">{p.sku}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{p.category_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                        {p.stock_quantity} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Queue */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={18} color="var(--primary-600)" /> Recent Order Activity
            </h3>
            <Link to="/admin/orders" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              View All Orders &rarr;
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p style={{ color: 'var(--neutral-500)', fontSize: '0.9rem' }}>No orders recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Company</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          to={`/orders/${o.id}`}
                          style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{o.customer_company || o.customer_name}</td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        INR {Number(o.total_amount).toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
