import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--gray-300)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gray-500)',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '6px' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', maxWidth: '400px', marginBottom: actionText ? '20px' : '0' }}>
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
