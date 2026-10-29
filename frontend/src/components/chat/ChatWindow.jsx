import React, { useEffect, useRef } from 'react';
import { User, Phone, Shield, WifiOff, Stethoscope, HeartPulse } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import EmergencyAlertButton from './EmergencyAlertButton';

const ChatWindow = ({
  conversation,
  messages = [],
  currentUserId,
  userRole = 'PATIENT',
  onSendMessage,
  isUserOnline,
  typingUserName,
  isConnected = true,
  startTyping,
  stopTyping,
  onAlertTriggered,
}) => {
  const messagesEndRef = useRef(null);

  const otherUser = userRole === 'PATIENT' ? conversation?.doctor : conversation?.patient;
  const isOnline = isUserOnline ? isUserOnline(otherUser?._id) : false;

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, typingUserName]);

  if (!conversation) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: 'var(--bg-app, #f8fafc)',
          color: 'var(--gray-500, #64748b)',
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--gray-200, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--gray-500)',
          }}
        >
          <Stethoscope size={32} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--gray-800, #1e293b)' }}>
          Clinical Messaging Console
        </h3>
        <p style={{ fontSize: '0.875rem', maxWidth: '360px', marginTop: '6px' }}>
          Select an active patient or doctor conversation from the inbox on the left to begin real-time consultation.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-app, #f8fafc)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: 'var(--bg-card, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: userRole === 'PATIENT' ? '#dbeafe' : '#ccfbf1',
                color: userRole === 'PATIENT' ? '#1e40af' : '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1rem',
                border: '1.5px solid var(--border-subtle, #cbd5e1)',
              }}
            >
              {otherUser?.name ? otherUser.name[0].toUpperCase() : <User size={20} />}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10b981' : '#94a3b8',
                border: '2px solid #ffffff',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--gray-900, #0f172a)' }}>
                {otherUser?.name}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isOnline ? '#ecfdf5' : '#f1f5f9',
                  color: isOnline ? '#059669' : '#64748b',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isOnline ? '#10b981' : '#94a3b8',
                  }}
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500, #64748b)', marginTop: '1px' }}>
              {otherUser?.specialization
                ? `${otherUser.specialization} • EliteCare Physician`
                : otherUser?.bloodGroup
                ? `Blood Group: ${otherUser.bloodGroup} • Gender: ${otherUser.gender || 'Patient'}`
                : 'Healthcare Member'}
            </div>
          </div>
        </div>

        {/* Action area: Emergency Alert Button for Patients */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {userRole === 'PATIENT' && (
            <EmergencyAlertButton
              doctorId={otherUser?._id}
              conversationId={conversation?._id}
              onAlertTriggered={onAlertTriggered}
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Disconnection Banner if socket dropped */}
      {!isConnected && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            color: '#b45309',
            padding: '6px 16px',
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderBottom: '1px solid #fde68a',
          }}
        >
          <WifiOff size={14} /> Reconnecting to EliteCare real-time messaging server...
        </div>
      )}

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              color: 'var(--gray-400)',
              fontSize: '0.85rem',
            }}
          >
            <p>No messages yet in this consultation.</p>
            <p style={{ marginTop: '4px', fontSize: '0.78rem' }}>
              Send a secure message to start direct communication.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id
              ? msg.sender._id.toString() === currentUserId.toString()
              : msg.sender?.toString() === currentUserId.toString();

            return (
              <MessageBubble
                key={msg._id || msg.clientTempId || Math.random()}
                message={msg}
                isMe={isMe}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {typingUserName && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--gray-500)',
              fontStyle: 'italic',
              marginTop: '4px',
              paddingLeft: '8px',
            }}
          >
            {typingUserName} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        conversationId={conversation._id}
        onSendMessage={onSendMessage}
        startTyping={startTyping}
        stopTyping={stopTyping}
        disabled={!isConnected}
      />
    </div>
  );
};

export default ChatWindow;
