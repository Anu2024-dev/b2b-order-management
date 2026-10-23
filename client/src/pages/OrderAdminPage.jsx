import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { ClipboardList, Edit, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const OrderAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Status update modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch all orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    // Suggest next logical transition
    const nextTransitions = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    setNewStatus(nextTransitions[order.status] || order.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });

      setSuccess(`Order ${selectedOrder.order_number} status updated to '${newStatus}'`);
      setIsModalOpen(false);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Commercial Order Fulfillment Queue</h1>
          <p className="subtitle">Oversee cross-company purchase requisitions and transition order lifecycles</p>
        </div>

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

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Loading fulfillment queue..." />
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <ClipboardList size={48} color="var(--neutral-400)" style={{ margin: '0 auto 1rem' }} />
          <h3>No orders in queue</h3>
          <p style={{ color: 'var(--neutral-500)' }}>No customer orders matched this filter.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer & Entity</th>
                  <th>Order Date</th>
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
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customer_company || o.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
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
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link to={`/orders/${o.id}`} className="btn btn-sm btn-secondary" title="View details">
                          <Eye size={14} />
                        </Link>

                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenStatusModal(o)}
                            title="Update Status"
                          >
                            <Edit size={14} /> Advance Status
                          </button>
                        )}
                      </div>
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

      {/* Modal for Status Transition */}
      <Modal
        isOpen={isModalOpen}
        title={selectedOrder ? `Transition Status: ${selectedOrder.order_number}` : 'Update Status'}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleUpdateStatus}>
          <p style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', marginBottom: '1rem' }}>
            Current Status: <strong>{selectedOrder?.status}</strong>
          </p>

          <div className="form-group">
            <label className="form-label">Permitted Target Status *</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {selectedOrder?.status === 'PENDING' && (
                <>
                  <option value="CONFIRMED">CONFIRMED (Acknowledge Purchase Order)</option>
                  <option value="CANCELLED">CANCELLED (Restore Stock to Inventory)</option>
                </>
              )}

              {selectedOrder?.status === 'CONFIRMED' && (
                <>
                  <option value="PROCESSING">PROCESSING (Picking & Packing)</option>
                  <option value="CANCELLED">CANCELLED (Restore Stock to Inventory)</option>
                </>
              )}

              {selectedOrder?.status === 'PROCESSING' && (
                <option value="SHIPPED">SHIPPED (Handed to Logistics Carrier)</option>
              )}

              {selectedOrder?.status === 'SHIPPED' && (
                <option value="DELIVERED">DELIVERED (Customer Receipt Confirmed)</option>
              )}
            </select>
          </div>

          {newStatus === 'CANCELLED' && (
            <div className="alert alert-warning">
              <strong>Stock Cancellation Rule:</strong> Marking this order as CANCELLED will immediately execute a database transaction to return all deducted line items back into product inventory.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating}>
              <CheckCircle2 size={16} /> {updating ? 'Applying...' : 'Apply Lifecycle Transition'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrderAdminPage;
