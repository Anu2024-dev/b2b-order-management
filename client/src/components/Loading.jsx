import React from 'react';

export const Loading = ({ message = 'Loading data...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        color: 'var(--neutral-500)',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--neutral-200)',
          borderTopColor: 'var(--primary-600)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '0.75rem',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</p>
    </div>
  );
};

export default Loading;
