import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Boxes, ArrowUpDown, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';

export const InventoryAdminPage = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);

  // Stock adjustment modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    changeQuantity: '',
    reason: 'RESTOCK_SHIPMENT',
    referenceId: '',
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.data);
      if (res.data.data.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: res.data.data[0].id }));
      }
    } catch {
      // Ignore
    }
  };

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/inventory?page=${page}&limit=12`);
      setMovements(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch inventory movements');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const qty = parseInt(formData.changeQuantity, 10);
    if (!qty || qty === 0) {
      setError('Change quantity must be non-zero (positive to add, negative to deduct).');
      return;
    }

    try {
      const res = await api.post('/admin/inventory/adjustments', {
        productId: parseInt(formData.productId, 10),
        changeQuantity: qty,
        reason: formData.reason,
        referenceId: formData.referenceId.trim() || undefined,
      });

      setSuccess(
        `Adjusted stock for ${res.data.data.product.name}: now ${res.data.data.product.currentStock} units.`
      );
      setIsModalOpen(false);
      setFormData({
        productId: products[0]?.id || '',
        changeQuantity: '',
        reason: 'RESTOCK_SHIPMENT',
        referenceId: '',
      });
      fetchMovements();
    } catch (err) {
      setError(err.response?.data?.message || 'Stock adjustment failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Inventory & Stock Ledger</h1>
          <p className="subtitle">Traceable warehouse stock changes, deductions, and adjustments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <ArrowUpDown size={18} /> Make Stock Adjustment
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Loading inventory movement records..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product SKU & Name</th>
                  <th>Quantity Change</th>
                  <th>Balance After</th>
                  <th>Reason</th>
                  <th>Reference PO / Order</th>
                  <th>Authorizing Actor</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isPositive = m.change_quantity > 0;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="product-sku">{m.product_sku}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.product_name}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: isPositive ? '#16a34a' : '#dc2626' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          {isPositive ? `+${m.change_quantity}` : m.change_quantity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{m.balance_after} units</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--neutral-100)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {m.reason}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {m.reference_id || '—'}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{m.actor_name || 'System Worker'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '0 1rem 1rem' }}>
            <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      <Modal isOpen={isModalOpen} title="Record Inventory Adjustment" onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Target Product *</label>
            <select
              className="form-select"
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (Current Stock: {p.stock_quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Quantity Change * (Use positive to restock, negative to write-off)
            </label>
            <input
              type="number"
              className="form-input"
              required
              placeholder="e.g. 50 or -5"
              value={formData.changeQuantity}
              onChange={(e) => setFormData({ ...formData, changeQuantity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment Reason *</label>
            <select
              className="form-select"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <option value="RESTOCK_SHIPMENT">RESTOCK_SHIPMENT (Supplier Delivery)</option>
              <option value="INVENTORY_RECOUNT">INVENTORY_RECOUNT (Audit Discrepancy)</option>
              <option value="DAMAGED_WRITE_OFF">DAMAGED_WRITE_OFF (Warehouse Damage)</option>
              <option value="RETURN_TO_SUPPLIER">RETURN_TO_SUPPLIER (Quality Defect)</option>
              <option value="MANUAL_CORRECTION">MANUAL_CORRECTION (System Correction)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">PO / Delivery Reference ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PO-ARROW-2026-88"
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Execute Stock Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryAdminPage;
