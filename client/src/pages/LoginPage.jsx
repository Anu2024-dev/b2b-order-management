import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/catalog');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail('purchasing@apexsolutions.example.com');
    setPassword('CustomerSecure#2026');
  };

  const fillAdminDemo = () => {
    setEmail('admin@arrowdistributors.example.com');
    setPassword('AdminSecurePass#2026');
  };

  return (
    <div style={{ maxWidth: '450px', margin: '2rem auto' }}>
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
            <LogIn size={28} />
          </div>
          <h2>B2B Account Login</h2>
          <p className="subtitle">Access your commercial order portal</p>
        </div>

        {isExpired && (
          <Alert type="warning" message="Your session has expired. Please log in again." />
        )}

        {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Business Email Address
            </label>
            <input
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. purchasing@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--neutral-200)',
          }}
        >
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '0.5rem' }}>
            Internship Evaluator Quick-Fill Credentials:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{ flex: 1 }}
              onClick={fillCustomerDemo}
            >
              Demo Customer
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              style={{ flex: 1 }}
              onClick={fillAdminDemo}
            >
              Admin Officer
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          New business customer?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register Commercial Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
