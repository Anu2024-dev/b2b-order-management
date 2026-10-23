import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { UserPlus, Building2, Mail, Lock, Phone, MapPin, User } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/catalog');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const details = err.response?.data?.errors?.map((x) => x.message).join(', ');
      setError(details ? `${msg}: ${details}` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'var(--primary-50)',
              color: 'var(--primary-600)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <UserPlus size={28} />
          </div>
          <h2>Customer Account Registration</h2>
          <p className="subtitle">Register your business entity to place bulk procurement orders</p>
        </div>

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Contact Name *
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Patel"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Company Entity Name *
              </label>
              <input
                type="text"
                name="companyName"
                className="form-input"
                required
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Zenith Automation LLP"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Business Email *
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="procurement@company.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Secure Password (min 6 characters) *
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create strong account password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Official Warehouse / Delivery Address
            </label>
            <textarea
              name="address"
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Plot No., Industrial Area, City, State, PIN"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
