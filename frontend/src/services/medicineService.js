import api from './api';

export const medicineService = {
  getMedicines: async (params = {}) => {
    return await api.get('/medicines', { params });
  },

  getAlerts: async () => {
    return await api.get('/medicines/alerts/all');
  },

  getMedicineById: async (id) => {
    return await api.get(`/medicines/${id}`);
  },

  createMedicine: async (data) => {
    return await api.post('/medicines', data);
  },

  updateMedicine: async (id, data) => {
    return await api.put(`/medicines/${id}`, data);
  },

  updateStock: async (id, adjustmentData) => {
    return await api.put(`/medicines/${id}/stock`, adjustmentData);
  },

  deleteMedicine: async (id) => {
    return await api.delete(`/medicines/${id}`);
  },
};
