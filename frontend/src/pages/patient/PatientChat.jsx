import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chatService';
import ChatInbox from '../../components/chat/ChatInbox';
import ChatWindow from '../../components/chat/ChatWindow';
import EmergencyAlertButton, { MEDICAL_DISCLAIMER } from '../../components/chat/EmergencyAlertButton';
import EmergencyAlertStatus from '../../components/chat/EmergencyAlertStatus';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Stethoscope, ShieldAlert, AlertTriangle, MessageSquare, History, User } from 'lucide-react';

const PatientChat = () => {
  const { user } = useAuth();
  const {
    socket,
    isUserOnline,
    typingMap,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Doctors for New Chat
  const [doctorsList, setDoctorsList] = useState([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Patient's Emergency Alerts
  const [myAlerts, setMyAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConv(true);
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.data || []);
        if (!activeConversationId && res.data && res.data.length > 0) {
          setActiveConversationId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  }, [activeConversationId]);

  // Load patient emergency alerts
  const loadAlerts = useCallback(async () => {
    try {
      const res = await chatService.getEmergencyAlerts();
      if (res.success) {
        setMyAlerts(res.data || []);
        const pendingOrAck = (res.data || []).find((a) => a.status === 'PENDING' || a.status === 'ACKNOWLEDGED');
        setActiveAlert(pendingOrAck || null);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, []);

  // Load doctors for new conversation
  const loadDoctors = async () => {
    try {
      const res = await chatService.getAuthorizedDoctors();
      if (res.success) {
        setDoctorsList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    loadAlerts();
    loadDoctors();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        joinConversation(activeConversationId);
        const res = await chatService.getMessages(activeConversationId);
        if (res.success) {
          setMessages(res.data || []);
          markAsRead(activeConversationId);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, joinConversation, leaveConversation, markAsRead]);

  // Real-time message listener
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversation === activeConversationId) {
        setMessages((prev) => {
          // Deduplicate
          if (prev.some((m) => (m._id && m._id === newMsg._id) || (m.clientTempId && m.clientTempId === newMsg.clientTempId))) {
            return prev;
          }
          return [...prev, newMsg];
        });
        markAsRead(activeConversationId);
      }

      // Update conversations list preview
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversation
            ? {
                ...c,
                lastMessageText: newMsg.content,
                lastMessageAt: newMsg.createdAt,
                patientUnread: c._id === activeConversationId ? 0 : (c.patientUnread || 0) + 1,
              }
            : c
        )
      );
    };

    const handleStatusUpdate = ({ conversationId, readerId, status }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'READ' ? { ...m, status: 'READ' } : m))
        );
      }
    };

    const handleAlertConfirmed = (newAlert) => {
      setActiveAlert(newAlert);
      setMyAlerts((prev) => [newAlert, ...prev]);
    };

    const handleAlertUpdated = (updatedAlert) => {
      if (updatedAlert.patient?._id === user?._id || updatedAlert.patient === user?._id) {
        setActiveAlert(updatedAlert.status === 'RESOLVED' ? null : updatedAlert);
        setMyAlerts((prev) =>
          prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleStatusUpdate);
    socket.on('emergency_alert_confirmed', handleAlertConfirmed);
    socket.on('emergency_alert_updated', handleAlertUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('emergency_alert_confirmed', handleAlertConfirmed);
      socket.off('emergency_alert_updated', handleAlertUpdated);
    };
  }, [socket, activeConversationId, markAsRead, user?._id]);

  // Send message handler
  const handleSendMessage = async (content) => {
    if (!activeConversationId) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Optimistic UI update
    const optimisticMsg = {
      _id: tempId,
      clientTempId: tempId,
      conversation: activeConversationId,
      sender: { _id: user._id, name: user.name, role: user.role },
      content,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(activeConversationId, content, tempId);
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  // Start new chat with doctor
  const handleSelectDoctorForChat = async (doctorId) => {
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateConversation({ doctorId });
      if (res.success && res.data) {
        setIsDoctorModalOpen(false);
        await loadConversations();
        setActiveConversationId(res.data._id);
      }
    } catch (err) {
      alert(err.message || 'Failed to start conversation with doctor');
    } finally {
      setStartingChat(false);
    }
  };

  const activeConversation = conversations.find((c) => c._id === activeConversationId);

  // Typing user check
  const typingUserObject = typingMap[activeConversationId];
  let typingUserName = null;
  if (typingUserObject) {
    const keys = Object.keys(typingUserObject).filter((k) => k !== user?._id?.toString());
    if (keys.length > 0) {
      typingUserName = typingUserObject[keys[0]];
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '14px' }}>
      {/* Top Hub Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          padding: '14px 20px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--gray-900, #0f172a)' }}>
            Patient Doctor Messaging & Emergency Hub
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500, #64748b)', marginTop: '2px' }}>
            Real-time verified consultation with your EliteCare healthcare team.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--gray-100, #f1f5f9)',
              color: 'var(--gray-700, #334155)',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              cursor: 'pointer',
            }}
          >
            <History size={16} />
            <span>Alert History ({myAlerts.length})</span>
          </button>

          {/* Prominent Red Emergency Button */}
          <EmergencyAlertButton
            doctorId={activeConversation?.doctor?._id}
            conversationId={activeConversationId}
            onAlertTriggered={(alt) => setActiveAlert(alt)}
          />
        </div>
      </div>

      {/* Active Emergency Alert Banner if Pending or Acknowledged */}
      {activeAlert && (
        <EmergencyAlertStatus
          alert={activeAlert}
          userRole="PATIENT"
        />
      )}

      {/* Main Chat Interface Split View */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))',
        }}
      >
        {/* Left Inbox */}
        <ChatInbox
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
          onStartNewChat={() => setIsDoctorModalOpen(true)}
          userRole="PATIENT"
          isUserOnline={isUserOnline}
          loading={loadingConv}
        />

        {/* Right Active Conversation */}
        <ChatWindow
          conversation={activeConversation}
          messages={messages}
          currentUserId={user?._id}
          userRole="PATIENT"
          onSendMessage={handleSendMessage}
          isUserOnline={isUserOnline}
          typingUserName={typingUserName}
          isConnected={isConnected}
          startTyping={startTyping}
          stopTyping={stopTyping}
          onAlertTriggered={(alt) => setActiveAlert(alt)}
        />
      </div>

      {/* Doctor Selection Modal */}
      {isDoctorModalOpen && (
        <Modal
          isOpen={isDoctorModalOpen}
          onClose={() => setIsDoctorModalOpen(false)}
          title="Start Conversation with a Specialist"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Select a verified physician to open a private, encrypted consultation thread:
            </p>

            {doctorsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)' }}>
                No physicians currently available.
              </div>
            ) : (
              doctorsList.map((doc) => (
                <div
                  key={doc._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                    backgroundColor: 'var(--bg-app, #f8fafc)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#ccfbf1',
                        color: '#0f766e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                      }}
                    >
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--gray-900)' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: '600' }}>
                        {doc.specialization} &bull; {doc.department?.name || 'Department'}
                      </div>
                      {doc.qualification && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>
                          {doc.qualification}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectDoctorForChat(doc._id)}
                    disabled={startingChat}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-600, #2563eb)',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '0.825rem',
                      border: 'none',
                      cursor: startingChat ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Start Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Alert History Modal */}
      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Emergency Alert Log & Audit History"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {myAlerts.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-500)' }}>
                No past emergency alerts recorded.
              </div>
            ) : (
              myAlerts.map((alt) => (
                <div
                  key={alt._id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{alt.priority} PRIORITY</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {new Date(alt.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>{alt.description}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                    Status: <strong>{alt.status}</strong>
                    {alt.acknowledgedBy && ` • Acknowledged by: ${alt.acknowledgedBy.name || 'Staff'}`}
                    {alt.resolvedBy && ` • Resolved by: ${alt.resolvedBy.name || 'Staff'}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientChat;
