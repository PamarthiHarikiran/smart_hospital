import api from './api';

export const chatService = {
  // Conversations
  getConversations: (params = {}) => api.get('/chat/conversations', { params }),

  getOrCreateConversation: (data) => api.post('/chat/conversations', data),

  getConversationById: (id) => api.get(`/chat/conversations/${id}`),

  getMessages: (conversationId, params = {}) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId, data) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),

  markAsRead: (conversationId) => api.patch(`/chat/conversations/${conversationId}/read`),

  getUnreadCount: () => api.get('/chat/unread-count'),

  getAuthorizedDoctors: () => api.get('/chat/doctors'),

  getAuthorizedPatients: () => api.get('/chat/patients'),

  // Emergency Alerts
  createEmergencyAlert: (data) => api.post('/emergency-alerts', data),

  getEmergencyAlerts: (params = {}) => api.get('/emergency-alerts', { params }),

  getEmergencyAlertById: (id) => api.get(`/emergency-alerts/${id}`),

  acknowledgeAlert: (id, data = {}) => api.patch(`/emergency-alerts/${id}/acknowledge`, data),

  resolveAlert: (id, data = {}) => api.patch(`/emergency-alerts/${id}/resolve`, data),

  getActiveAlertsCount: () => api.get('/emergency-alerts/active-count'),
};

export default chatService;
