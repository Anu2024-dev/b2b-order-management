import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toUpperCase();

  const getStyleClass = () => {
    switch (norm) {
      case 'PENDING':
        return 'badge-pending';
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'PROCESSING':
        return 'badge-processing';
      case 'SHIPPED':
        return 'badge-shipped';
      case 'DELIVERED':
        return 'badge-delivered';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'ACTIVE':
      case 'PAID':
        return 'badge-active';
      case 'INACTIVE':
        return 'badge-inactive';
      default:
        return 'badge-inactive';
    }
  };

  return <span className={`badge ${getStyleClass()}`}>{status}</span>;
};

export default StatusBadge;
