import React, { useState } from 'react';
import { Search, Plus, User, Stethoscope, Clock, ShieldAlert } from 'lucide-react';
import UnreadMessageBadge from './UnreadMessageBadge';

const ChatInbox = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onStartNewChat,
  userRole = 'PATIENT',
  isUserOnline,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = conversations.filter((c) => {
    const otherParticipant = userRole === 'PATIENT' ? c.doctor : c.patient;
    const name = otherParticipant?.name || '';
    const lastText = c.lastMessageText || '';
    const spec = otherParticipant?.specialization || '';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || lastText.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
  });

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid var(--border-subtle, #e2e8f0)',
        backgroundColor: 'var(--bg-card, #ffffff)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gray-900, #0f172a)' }}>
            Conversations
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--gray-500, #64748b)' }}>
            {filtered.length} active {filtered.length === 1 ? 'thread' : 'threads'}
          </span>
        </div>

        {onStartNewChat && (
          <button
            type="button"
            onClick={onStartNewChat}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-600, #2563eb)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle, #e2e8f0)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--gray-400, #94a3b8)" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'var(--bg-input, #f8fafc)',
              color: 'var(--gray-900, #0f172a)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>No conversations yet</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '4px' }}>
              {userRole === 'PATIENT'
                ? 'Click "New Chat" to connect with your specialist.'
                : 'No patient chats initiated yet.'}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeConversationId === conv._id;
            const otherUser = userRole === 'PATIENT' ? conv.doctor : conv.patient;
            const online = isUserOnline ? isUserOnline(otherUser?._id) : false;
            const unread = userRole === 'PATIENT' ? conv.patientUnread : conv.doctorUnread;

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: isSelected
                    ? 'var(--primary-50, #eff6ff)'
                    : unread > 0
                    ? 'rgba(13, 148, 136, 0.05)'
                    : 'transparent',
                  borderLeft: isSelected ? '4px solid var(--primary-600, #2563eb)' : '4px solid transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Avatar with Online Badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
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
                      fontSize: '0.95rem',
                      border: '1px solid var(--border-subtle, #cbd5e1)',
                    }}
                  >
                    {otherUser?.name ? otherUser.name[0].toUpperCase() : <User size={18} />}
                  </div>
                  <span
                    title={online ? 'Online' : 'Offline'}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '11px',
                      height: '11px',
                      borderRadius: '50%',
                      backgroundColor: online ? '#10b981' : '#94a3b8',
                      border: '2px solid #ffffff',
                    }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontWeight: unread > 0 ? '700' : '600',
                        fontSize: '0.88rem',
                        color: 'var(--gray-900, #0f172a)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {otherUser?.name || 'Healthcare User'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400, #94a3b8)', flexShrink: 0 }}>
                      {formatTimestamp(conv.lastMessageAt)}
                    </span>
                  </div>

                  {otherUser?.specialization && (
                    <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: '600' }}>
                      {otherUser.specialization}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '3px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: unread > 0 ? 'var(--gray-900)' : 'var(--gray-500)',
                        fontWeight: unread > 0 ? '600' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px',
                      }}
                    >
                      {conv.lastMessageText || 'No messages yet'}
                    </span>
                    <UnreadMessageBadge count={unread} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatInbox;
