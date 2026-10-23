import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { User, Building2, Mail, Phone, MapPin, Shield, CheckCircle, LogOut } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    companyName: user?.company_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Profile details updated successfully');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <h1>Commercial Account Profile</h1>
      <p className="subtitle">Manage company details, contact information, and delivery locations</p>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ display: 'inline', marginRight: '4px' }} /> Contact Person Name
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> Company Entity
              </label>
              <input
                type="text"
                name="companyName"
                className="form-input"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Account Email (Read-Only)
              </label>
              <input
                type="email"
                className="form-input"
                disabled
                value={user?.email || ''}
                style={{ background: 'var(--neutral-100)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={14} style={{ display: 'inline', marginRight: '4px' }} /> Assigned Role
              </label>
              <input
                type="text"
                className="form-input"
                disabled
                value={user?.role?.toUpperCase() || ''}
                style={{ background: 'var(--neutral-100)', cursor: 'not-allowed', fontWeight: 700 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> Primary Contact Phone
            </label>
            <input
              type="text"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Default Delivery / Dispatch Address
            </label>
            <textarea
              name="address"
              className="form-textarea"
              rows={3}
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--neutral-200)', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <CheckCircle size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.4)' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
