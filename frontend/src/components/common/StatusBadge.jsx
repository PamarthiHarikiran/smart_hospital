import React from 'react';

const StatusBadge = ({ status, text }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const statusConfigs = {
    // Appointment / Bill / Lab statuses
    CONFIRMED: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    COMPLETED: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    VERIFIED: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    PAID: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    AVAILABLE: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    ACTIVE: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },

    PENDING: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    REQUESTED: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    SAMPLE_COLLECTED: { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
    PROCESSING: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
    ADMITTED: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },

    CANCELLED: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    OCCUPIED: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
    DISCHARGED: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    MAINTENANCE: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    INACTIVE: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    LOW_STOCK: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  };

  const config = statusConfigs[normalized] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.025em',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {text || normalized}
    </span>
  );
};

export default StatusBadge;
