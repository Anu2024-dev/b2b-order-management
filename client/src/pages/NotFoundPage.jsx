import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3rem 2rem' }}>
        <AlertCircle size={56} color="var(--primary-600)" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ color: 'var(--neutral-500)', margin: '1rem 0 1.5rem' }}>
          The requested route does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
