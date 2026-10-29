import React from 'react';

const Select = ({
  label,
  options = [],
  error,
  helperText,
  required = false,
  placeholder = 'Select an option',
  id,
  className = '',
  ...props
}) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
      {label && (
        <label
          htmlFor={selectId}
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

      <select
        id={selectId}
        style={{
          width: '100%',
          padding: '9px 12px',
          fontSize: '0.9rem',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? '#ef4444' : 'var(--border-subtle)'}`,
          backgroundColor: 'var(--bg-input, #ffffff)',
          color: 'var(--gray-900)',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, background-color 0.2s ease',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>

      {error ? (
        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export default Select;
