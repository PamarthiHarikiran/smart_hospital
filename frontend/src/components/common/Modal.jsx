import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '550px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sh-modal-backdrop" onClick={onClose}>
      <div
        className="sh-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sh-modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--gray-900)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              color: 'var(--gray-400)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sh-modal-body">{children}</div>

        {footer && <div className="sh-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
