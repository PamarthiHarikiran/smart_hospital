import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.85rem',
        color: 'var(--gray-600)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div>
        Showing <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{start}</span> to{' '}
        <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{end}</span> of{' '}
        <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>{total}</span> entries
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: page <= 1 ? 'var(--gray-100)' : '#ffffff',
            color: page <= 1 ? 'var(--gray-400)' : 'var(--gray-700)',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ padding: '0 8px', fontWeight: '500' }}>
          Page {page} of {pages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: page >= pages ? 'var(--gray-100)' : '#ffffff',
            color: page >= pages ? 'var(--gray-400)' : 'var(--gray-700)',
            cursor: page >= pages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
