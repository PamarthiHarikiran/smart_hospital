import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatService } from '../../services/chatService';
import ChatInbox from '../../components/chat/ChatInbox';
import ChatWindow from '../../components/chat/ChatWindow';
import EmergencyAlertList from '../../components/chat/EmergencyAlertList';
import Modal from '../../components/common/Modal';
import { ShieldAlert, AlertTriangle, Users, MessageSquare, Plus, Bell, CheckCircle2 } from 'lucide-react';

const DoctorMessages = () => {
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
    acknowledgeAlert,
    resolveAlert,
    activeAlertsCount,
  } = useSocket();

  const [activeTab, setActiveTab] = useState('CHAT'); // 'CHAT' | 'ALERTS'
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);

  // Patients for New Conversation
  const [patientsList, setPatientsList] = useState([]);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Emergency Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertStatusFilter, setAlertStatusFilter] = useState('ALL');

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

  // Load emergency alerts
  const loadAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const res = await chatService.getEmergencyAlerts({ status: alertStatusFilter });
      if (res.success) {
        setAlerts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  }, [alertStatusFilter]);

  // Load patients for starting new chat
  const loadPatients = async () => {
    try {
      const res = await chatService.getAuthorizedPatients();
      if (res.success) {
        setPatientsList(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load patients list:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    loadAlerts();
    loadPatients();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [alertStatusFilter, loadAlerts]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        joinConversation(activeConversationId);
        const res = await chatService.getMessages(activeConversationId);
        if (res.success) {
          setMessages(res.data || []);
          markAsRead(activeConversationId);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    return () => {
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, joinConversation, leaveConversation, markAsRead]);

  // Real-time Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversation === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => (m._id && m._id === newMsg._id) || (m.clientTempId && m.clientTempId === newMsg.clientTempId))) {
            return prev;
          }
          return [...prev, newMsg];
        });
        markAsRead(activeConversationId);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversation
            ? {
                ...c,
                lastMessageText: newMsg.content,
                lastMessageAt: newMsg.createdAt,
                doctorUnread: c._id === activeConversationId ? 0 : (c.doctorUnread || 0) + 1,
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

    const handleEmergencyAlertReceived = (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    };

    const handleEmergencyAlertUpdated = (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === updatedAlert._id ? updatedAlert : a))
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleStatusUpdate);
    socket.on('emergency_alert_received', handleEmergencyAlertReceived);
    socket.on('emergency_alert_updated', handleEmergencyAlertUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('emergency_alert_received', handleEmergencyAlertReceived);
      socket.off('emergency_alert_updated', handleEmergencyAlertUpdated);
    };
  }, [socket, activeConversationId, markAsRead]);

  // Send message handler
  const handleSendMessage = async (content) => {
    if (!activeConversationId) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;

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
      console.error('Send message error:', err);
    }
  };

  // Start new chat with patient
  const handleSelectPatientForChat = async (patientId) => {
    setStartingChat(true);
    try {
      const res = await chatService.getOrCreateConversation({ patientId });
      if (res.success && res.data) {
        setIsPatientModalOpen(false);
        await loadConversations();
        setActiveConversationId(res.data._id);
        setActiveTab('CHAT');
      }
    } catch (err) {
      alert(err.message || 'Failed to initialize conversation');
    } finally {
      setStartingChat(false);
    }
  };

  const handleAcknowledge = async (alertId, note) => {
    await acknowledgeAlert(alertId, note);
    loadAlerts();
  };

  const handleResolve = async (alertId, note) => {
    await resolveAlert(alertId, note);
    loadAlerts();
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING');
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
      {/* Top Banner for Pending Emergencies if Any */}
      {pendingAlerts.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                animation: 'pulse 1.2s infinite',
              }}
            />
            <div>
              <div style={{ fontWeight: '800', color: '#991b1b', fontSize: '0.92rem' }}>
                🚨 {pendingAlerts.length} CLINICAL EMERGENCY ALERT{pendingAlerts.length > 1 ? 'S' : ''} REQUIRING ATTENTION
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>
                Latest: {pendingAlerts[0].patient?.name} &bull; "{pendingAlerts[0].description}"
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('ALERTS')}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              padding: '7px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
            }}
          >
            Review Alert Queue
          </button>
        </div>
      )}

      {/* Navigation & Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          padding: '12px 20px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--gray-900, #0f172a)' }}>
            Doctor Clinical Messaging & Emergency Desk
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500, #64748b)', marginTop: '2px' }}>
            Direct authorized patient messaging and real-time hospital emergency alert response.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setActiveTab('CHAT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              backgroundColor: activeTab === 'CHAT' ? 'var(--primary-600, #2563eb)' : 'var(--gray-100, #f1f5f9)',
              color: activeTab === 'CHAT' ? '#ffffff' : 'var(--gray-700)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={16} />
            <span>Messages ({conversations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ALERTS')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              backgroundColor: activeTab === 'ALERTS' ? '#dc2626' : 'var(--gray-100, #f1f5f9)',
              color: activeTab === 'ALERTS' ? '#ffffff' : pendingAlerts.length > 0 ? '#dc2626' : 'var(--gray-700)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldAlert size={16} />
            <span>Emergency Alerts</span>
            {pendingAlerts.length > 0 && (
              <span
                style={{
                  backgroundColor: activeTab === 'ALERTS' ? '#ffffff' : '#dc2626',
                  color: activeTab === 'ALERTS' ? '#dc2626' : '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  borderRadius: '999px',
                  padding: '1px 6px',
                }}
              >
                {pendingAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'CHAT' ? (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            overflow: 'hidden',
          }}
        >
          {/* Inbox */}
          <ChatInbox
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onStartNewChat={() => setIsPatientModalOpen(true)}
            userRole="DOCTOR"
            isUserOnline={isUserOnline}
            loading={loadingConv}
          />

          {/* Active Chat Window */}
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            currentUserId={user?._id}
            userRole="DOCTOR"
            onSendMessage={handleSendMessage}
            isUserOnline={isUserOnline}
            typingUserName={typingUserName}
            isConnected={isConnected}
            startTyping={startTyping}
            stopTyping={stopTyping}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--gray-900)' }}>
              Emergency Alert Dispatch Queue
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '2px' }}>
              Real-time incoming alerts from patients requiring urgent clinical evaluation.
            </p>
          </div>

          <EmergencyAlertList
            alerts={alerts}
            loading={alertsLoading}
            userRole="DOCTOR"
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            selectedStatus={alertStatusFilter}
            onStatusChange={setAlertStatusFilter}
          />
        </div>
      )}

      {/* Patient Selection Modal */}
      {isPatientModalOpen && (
        <Modal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          title="Select Patient for Consultation"
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {patientsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)' }}>
                No patient records available.
              </div>
            ) : (
              patientsList.map((pat) => (
                <div
                  key={pat._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{pat.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                      Blood Group: {pat.bloodGroup || 'N/A'} &bull; Phone: {pat.phone || 'N/A'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPatientForChat(pat._id)}
                    disabled={startingChat}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--primary-600)',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '0.825rem',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Open Thread
                  </button>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorMessages;
