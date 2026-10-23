import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { ClipboardList, FileText, ArrowRight, Eye } from 'lucide-react';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>My Procurement Orders</h1>
          <p className="subtitle">Track statuses, line items, and invoice history for your account</p>
        </div>

        {/* Status filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Fetching your orders..." />
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <ClipboardList size={48} color="var(--neutral-400)" style={{ margin: '0 auto 1rem' }} />
          <h3>No orders found</h3>
          <p style={{ color: 'var(--neutral-500)', marginBottom: '1.5rem' }}>
            You haven't placed any procurement orders matching this criteria.
          </p>
          <Link to="/catalog" className="btn btn-primary">
            Browse Catalog & Place Order
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-800)' }}>
                        {o.order_number}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>{o.item_count} items</td>
                    <td style={{ fontWeight: 700 }}>
                      INR {Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      {o.invoice_id ? (
                        <Link
                          to={`/invoices/${o.invoice_id}`}
                          style={{
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          <FileText size={14} /> {o.invoice_number}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--neutral-400)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/orders/${o.id}`} className="btn btn-sm btn-secondary">
                        <Eye size={14} /> View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0 1rem 1rem' }}>
            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
