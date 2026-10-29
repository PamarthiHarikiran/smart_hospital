import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';

const SocketContext = createContext(null);

const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    return 'http://localhost:5000';
  }
  // A relative API base (e.g. "/api") means the backend also serves this app
  if (apiUrl.startsWith('/')) {
    return window.location.origin;
  }
  return apiUrl.replace(/\/api\/?$/, '');
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingMap, setTypingMap] = useState({});
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [latestEmergencyAlert, setLatestEmergencyAlert] = useState(null);

  const socketRef = useRef(null);

  // Initial fetch for counts
  const refreshCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [unreadRes, alertsRes] = await Promise.allSettled([
        chatService.getUnreadCount(),
        chatService.getActiveAlertsCount(),
      ]);

      if (unreadRes.status === 'fulfilled' && unreadRes.value?.success) {
        setUnreadChatCount(unreadRes.value.unreadCount || 0);
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value?.success) {
        setActiveAlertsCount(alertsRes.value.pending || 0);
      }
    } catch (err) {
      // silent catch
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // Establish Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketURL = getSocketURL();
    const newSocket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('online_users_list');
      refreshCounts();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
      setIsConnected(false);
    });

    // Online presence events
    newSocket.on('online_users_list', (userIdList) => {
      if (Array.isArray(userIdList)) {
        setOnlineUserIds(new Set(userIdList.map(String)));
      }
    });

    newSocket.on('user_online', ({ userId }) => {
      if (userId) {
        setOnlineUserIds((prev) => new Set([...prev, String(userId)]));
      }
    });

    newSocket.on('user_offline', ({ userId }) => {
      if (userId) {
        setOnlineUserIds((prev) => {
          const updated = new Set(prev);
          updated.delete(String(userId));
          return updated;
        });
      }
    });

    // Typing indicators
    newSocket.on('user_typing', ({ conversationId, userId, userName }) => {
      setTypingMap((prev) => {
        const current = prev[conversationId] || {};
        return {
          ...prev,
          [conversationId]: {
            ...current,
            [userId]: userName || 'Someone',
          },
        };
      });
    });

    newSocket.on('user_stopped_typing', ({ conversationId, userId }) => {
      setTypingMap((prev) => {
        const current = { ...(prev[conversationId] || {}) };
        delete current[userId];
        return {
          ...prev,
          [conversationId]: current,
        };
      });
    });

    // Direct unread notification
    newSocket.on('unread_notification', (data) => {
      setUnreadChatCount((prev) => prev + 1);
    });

    // Emergency alert events
    newSocket.on('emergency_alert_received', (alert) => {
      setLatestEmergencyAlert(alert);
      setActiveAlertsCount((prev) => prev + 1);
      // Optional browser audio chime or visual cue
    });

    newSocket.on('emergency_alert_updated', (alert) => {
      if (alert.status === 'RESOLVED') {
        setActiveAlertsCount((prev) => Math.max(0, prev - 1));
      }
      setLatestEmergencyAlert((prev) => (prev?._id === alert._id ? alert : prev));
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, refreshCounts]);

  // Helper method: Check if user is online
  const isUserOnline = useCallback(
    (targetUserId) => {
      if (!targetUserId) return false;
      return onlineUserIds.has(String(targetUserId));
    },
    [onlineUserIds]
  );

  // Helper method: Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected && conversationId) {
      socketRef.current.emit('join_conversation', { conversationId });
    }
  }, []);

  // Helper method: Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected && conversationId) {
      socketRef.current.emit('leave_conversation', { conversationId });
    }
  }, []);

  // Helper method: Send Message via Socket
  const sendMessage = useCallback(
    (conversationId, content, clientTempId, messageType = 'TEXT') => {
      return new Promise((resolve, reject) => {
        if (!socketRef.current || !socketRef.current.connected) {
          // Fallback to REST API if socket is disconnected
          chatService
            .sendMessage(conversationId, { content, clientTempId, messageType })
            .then((res) => resolve(res.data))
            .catch(reject);
          return;
        }

        socketRef.current.emit(
          'send_message',
          { conversationId, content, clientTempId, messageType },
          (response) => {
            if (response?.success) {
              resolve(response.message);
            } else {
              // Try fallback to REST
              chatService
                .sendMessage(conversationId, { content, clientTempId, messageType })
                .then((res) => resolve(res.data))
                .catch(reject);
            }
          }
        );
      });
    },
    []
  );

  // Helper method: Mark message as read
  const markAsRead = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected && conversationId) {
      socketRef.current.emit('message_read', { conversationId });
    }
    // Also trigger REST for reliable persistence
    chatService.markAsRead(conversationId).catch(() => {});
    setUnreadChatCount((c) => Math.max(0, c - 1));
  }, []);

  // Helper method: Send Emergency Alert
  const sendEmergencyAlert = useCallback((data) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        // Fallback to REST
        chatService
          .createEmergencyAlert(data)
          .then((res) => resolve(res.data))
          .catch(reject);
        return;
      }

      socketRef.current.emit('trigger_emergency_alert', data, (response) => {
        if (response?.success) {
          resolve(response.alert);
        } else {
          // Fallback to REST
          chatService
            .createEmergencyAlert(data)
            .then((res) => resolve(res.data))
            .catch(reject);
        }
      });
    });
  }, []);

  // Helper method: Acknowledge Emergency Alert
  const acknowledgeAlert = useCallback((alertId, note = '') => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        chatService
          .acknowledgeAlert(alertId, { note })
          .then((res) => resolve(res.data))
          .catch(reject);
        return;
      }

      socketRef.current.emit('acknowledge_emergency_alert', { alertId, note }, (response) => {
        if (response?.success) {
          resolve(response.alert);
        } else {
          chatService
            .acknowledgeAlert(alertId, { note })
            .then((res) => resolve(res.data))
            .catch(reject);
        }
      });
    });
  }, []);

  // Helper method: Resolve Emergency Alert
  const resolveAlert = useCallback((alertId, note = '') => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        chatService
          .resolveAlert(alertId, { note })
          .then((res) => resolve(res.data))
          .catch(reject);
        return;
      }

      socketRef.current.emit('resolve_emergency_alert', { alertId, note }, (response) => {
        if (response?.success) {
          resolve(response.alert);
        } else {
          chatService
            .resolveAlert(alertId, { note })
            .then((res) => resolve(res.data))
            .catch(reject);
        }
      });
    });
  }, []);

  // Typing helpers
  const startTyping = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected && conversationId) {
      socketRef.current.emit('typing_start', { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId) => {
    if (socketRef.current && socketRef.current.connected && conversationId) {
      socketRef.current.emit('typing_stop', { conversationId });
    }
  }, []);

  const joinLabReport = useCallback((reportId) => {
    if (socketRef.current && socketRef.current.connected && reportId) {
      socketRef.current.emit('join_lab_report', { reportId });
    }
  }, []);

  const leaveLabReport = useCallback((reportId) => {
    if (socketRef.current && socketRef.current.connected && reportId) {
      socketRef.current.emit('leave_lab_report', { reportId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        isUserOnline,
        typingMap,
        unreadChatCount,
        activeAlertsCount,
        latestEmergencyAlert,
        setLatestEmergencyAlert,
        refreshCounts,
        joinConversation,
        leaveConversation,
        sendMessage,
        markAsRead,
        sendEmergencyAlert,
        acknowledgeAlert,
        resolveAlert,
        startTyping,
        stopTyping,
        joinLabReport,
        leaveLabReport,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
