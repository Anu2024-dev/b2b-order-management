import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={20} />;
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`alert alert-${type}`}>
      {getIcon()}
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem',
            color: 'inherit',
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
