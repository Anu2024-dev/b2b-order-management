import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--neutral-200)',
      }}
    >
      <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
        Showing page {page} of {totalPages} ({total} total records)
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
