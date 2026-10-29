import React from 'react';

const UnreadMessageBadge = ({ count, className = '', style = {} }) => {
  if (!count || count <= 0) return null;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '9999px',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        fontSize: '0.72rem',
        fontWeight: '700',
        lineHeight: 1,
        boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
        ...style,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default UnreadMessageBadge;
