import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorMessage = ({ message = 'Something went wrong', onRetry }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 'var(--radius-sm)',
        color: '#991b1b',
        fontSize: '0.875rem',
        marginBottom: '16px',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} color="#dc2626" />
        <span>{message}</span>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
