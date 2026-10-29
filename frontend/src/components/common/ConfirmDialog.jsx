import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: variant === 'danger' ? '#fef2f2' : '#eff6ff',
            color: variant === 'danger' ? '#dc2626' : '#2563eb',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <div style={{ fontSize: '0.925rem', color: 'var(--gray-600)', lineHeight: '1.5' }}>
          {message}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
