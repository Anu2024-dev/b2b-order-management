import React from 'react';

export const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--neutral-200)',
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--neutral-500)',
            }}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
