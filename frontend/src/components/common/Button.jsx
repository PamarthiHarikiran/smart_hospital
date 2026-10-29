import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '500',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.825rem' },
    md: { padding: '9px 18px', fontSize: '0.9rem' },
    lg: { padding: '12px 24px', fontSize: '1rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary-600)',
      color: '#ffffff',
      borderColor: 'var(--primary-600)',
    },
    secondary: {
      backgroundColor: 'var(--gray-100)',
      color: 'var(--gray-800)',
      borderColor: 'var(--gray-300)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary-600)',
      borderColor: 'var(--primary-600)',
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      borderColor: '#dc2626',
    },
    success: {
      backgroundColor: '#059669',
      color: '#ffffff',
      borderColor: '#059669',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--gray-700)',
      borderColor: 'transparent',
    },
  };

  const appliedStyle = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    opacity: disabled || loading ? 0.65 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
  };

  return (
    <button
      type={type}
      style={appliedStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={`sh-button ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
