import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit2, CheckCircle2, XCircle, Search, Package } from 'lucide-react';

export const ProductAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    unitPrice: '',
    stockQuantity: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch {
      // Ignore
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, search: search.trim() || undefined };
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      unitPrice: '',
      stockQuantity: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      description: p.description || '',
      categoryId: p.category_id,
      unitPrice: p.unit_price,
      stockQuantity: p.stock_quantity,
      isActive: p.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: parseInt(formData.categoryId, 10),
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        isActive: formData.isActive,
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, payload);
        setSuccess(`Product '${payload.name}' updated successfully`);
      } else {
        await api.post('/products', {
          ...payload,
          sku: formData.sku.trim().toUpperCase(),
        });
        setSuccess(`Product '${payload.name}' created with SKU ${formData.sku}`);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.is_active;
      await api.patch(`/products/${product.id}/status`, { isActive: newStatus });
      setSuccess(`Product ${product.name} ${newStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change product status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Product Catalog Administration</h1>
          <p className="subtitle">Create and update catalog specifications, pricing, and active statuses</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Add New Catalog Product
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {/* Search Bar */}
      <div className="card" style={{ padding: '0.85rem', marginBottom: '1rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchProducts();
          }}
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Search by SKU, product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loading message="Loading product records..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price (INR)</th>
                  <th style={{ textAlign: 'center' }}>Stock Available</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="product-sku">{p.sku}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.category_name}</td>
                    <td style={{ fontWeight: 600 }}>INR {Number(p.unit_price).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.stock_quantity}</td>
                    <td>
                      <StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit product"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className={`btn btn-sm ${p.is_active ? 'btn-danger' : 'btn-outline'}`}
                          onClick={() => handleToggleStatus(p)}
                          title={p.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
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

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Create New Catalog Product'}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          {!editingProduct && (
            <div className="form-group">
              <label className="form-label">SKU (Unique Identifier) *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-ELEC-900"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Solid State Relay 40A 240VAC"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Category *</label>
              <select
                className="form-select"
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Available Stock Quantity *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active for Ordering</label>
              <select
                className="form-select"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active (Visible to Customers)</option>
                <option value="false">Inactive (Hidden from Ordering)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description & Technical Details</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item technical specifications, voltage, packaging, dimensions..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Product Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductAdminPage;
