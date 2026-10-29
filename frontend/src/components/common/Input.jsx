import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  required = false,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--gray-700)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={18} />
          </span>
        )}

        <input
          id={inputId}
          type={type}
          style={{
            width: '100%',
            padding: '9px 12px',
            paddingLeft: Icon ? '38px' : '12px',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border-subtle)'}`,
            backgroundColor: 'var(--bg-input, #ffffff)',
            color: 'var(--gray-900)',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease',
          }}
          {...props}
        />
      </div>

      {error ? (
        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
