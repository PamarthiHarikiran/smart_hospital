import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 28, text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        gap: '12px',
        color: 'var(--gray-500)',
      }}
    >
      <Loader2
        size={size}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--primary-600)',
        }}
      />
      {text && <span style={{ fontSize: '0.875rem' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
