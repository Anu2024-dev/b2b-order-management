import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer no-print">
      <div className="footer-container">
        <div>
          <strong>Arrowstack B2B Order Management Platform</strong>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
            Simulated enterprise distribution platform engineered for Arrowstack Full Stack Internship Project 1.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>PostgreSQL 18 &bull; Express.js &bull; React &bull; Node.js</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Authoritative Server Calculations &bull; Database Transactions &bull; Immutable Audit Logs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
