import React from 'react';
import { Check, CheckCheck, AlertOctagon } from 'lucide-react';

const MessageBubble = ({ message, isMe, isClinicalTeal = false }) => {
  const isEmergencyNote = message.messageType === 'EMERGENCY_NOTE';

  const renderStatus = () => {
    if (!isMe) return null;

    if (message.status === 'READ') {
      return (
        <span title="Read" style={{ display: 'inline-flex', alignItems: 'center', color: '#0d9488' }}>
          <CheckCheck size={14} strokeWidth={2.5} />
        </span>
      );
    }
    if (message.status === 'DELIVERED') {
      return (
        <span title="Delivered" style={{ display: 'inline-flex', alignItems: 'center', color: '#94a3b8' }}>
          <CheckCheck size={14} strokeWidth={2} />
        </span>
      );
    }
    return (
      <span title="Sent" style={{ display: 'inline-flex', alignItems: 'center', color: '#94a3b8' }}>
        <Check size={14} strokeWidth={2} />
      </span>
    );
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        marginBottom: '10px',
        padding: '0 4px',
      }}
    >
      {!isMe && message.sender?.name && (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: 'var(--gray-500)',
            marginBottom: '3px',
            marginLeft: '4px',
          }}
        >
          {message.sender.name} {message.sender.role === 'DOCTOR' ? '(Physician)' : ''}
        </span>
      )}

      <div
        style={{
          maxWidth: '75%',
          minWidth: '100px',
          padding: '10px 14px',
          borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
          backgroundColor: isEmergencyNote
            ? '#fef2f2'
            : isMe
            ? 'var(--primary-600, #2563eb)'
            : 'var(--bg-card, #ffffff)',
          color: isEmergencyNote
            ? '#991b1b'
            : isMe
            ? '#ffffff'
            : 'var(--gray-800, #1e293b)',
          border: isEmergencyNote
            ? '1.5px solid #ef4444'
            : isMe
            ? '1px solid transparent'
            : '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          wordBreak: 'break-word',
          lineHeight: 1.45,
          fontSize: '0.9rem',
        }}
      >
        {isEmergencyNote && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '800',
              fontSize: '0.8rem',
              color: '#dc2626',
              marginBottom: '6px',
              paddingBottom: '4px',
              borderBottom: '1px solid #fecaca',
            }}
          >
            <AlertOctagon size={16} /> CLINICAL EMERGENCY NOTE
          </div>
        )}

        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            marginTop: '4px',
            fontSize: '0.7rem',
            color: isMe ? 'rgba(255, 255, 255, 0.75)' : 'var(--gray-400)',
          }}
        >
          <span>{formattedTime}</span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
