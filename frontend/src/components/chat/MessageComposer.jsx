import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Loader2 } from 'lucide-react';

const MessageComposer = ({
  onSendMessage,
  conversationId,
  startTyping,
  stopTyping,
  disabled = false,
  placeholder = 'Type a message... (Enter to send, Shift+Enter for new line)',
}) => {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setContent(e.target.value);

    if (startTyping && conversationId) {
      startTyping(conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (stopTyping) stopTyping(conversationId);
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || sending || disabled) return;

    const trimmed = content.trim();
    setSending(true);

    try {
      if (stopTyping && conversationId) {
        stopTyping(conversationId);
      }
      setContent('');
      await onSendMessage(trimmed);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <form
      onSubmit={handleSend}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle, #e2e8f0)',
        backgroundColor: 'var(--bg-card, #ffffff)',
      }}
    >
      <textarea
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Connecting to chat server...' : placeholder}
        disabled={disabled || sending}
        rows={1}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '20px',
          border: '1.5px solid var(--border-subtle, #cbd5e1)',
          backgroundColor: 'var(--bg-input, #f8fafc)',
          color: 'var(--gray-900, #0f172a)',
          fontSize: '0.9rem',
          outline: 'none',
          resize: 'none',
          maxHeight: '100px',
          minHeight: '42px',
          lineHeight: '1.4',
        }}
      />

      <button
        type="submit"
        disabled={disabled || sending || !content.trim()}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: !content.trim() || disabled ? 'var(--gray-300, #cbd5e1)' : 'var(--primary-600, #2563eb)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: !content.trim() || disabled ? 'not-allowed' : 'pointer',
          boxShadow: !content.trim() || disabled ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.35)',
          transition: 'all 0.15s ease',
        }}
        title="Send Message"
      >
        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
  );
};

export default MessageComposer;
