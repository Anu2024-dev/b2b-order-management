import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Loading } from '../components/Loading';
import { Alert } from '../components/Alert';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit2, Layers } from 'lucide-react';

export const CategoryAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/categories?includeInactive=true');
      setCategories(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({ name: c.name, description: c.description || '', isActive: c.is_active });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        });
        setSuccess(`Category '${formData.name}' updated`);
      } else {
        await api.post('/categories', {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        setSuccess(`Category '${formData.name}' created`);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Category Management</h1>
          <p className="subtitle">Configure component groups and product classifications</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Add New Category
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Loading message="Loading product categories..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{c.name}</td>
                    <td style={{ color: 'var(--neutral-600)', fontSize: '0.85rem' }}>{c.description || '—'}</td>
                    <td>
                      <StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleOpenEdit(c)}>
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Hydraulics & Fluid Power"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Overview of industrial supplies in this category..."
            />
          </div>

          {editingCategory && (
            <div className="form-group">
              <label className="form-label">Active Status</label>
              <select
                className="form-select"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryAdminPage;
