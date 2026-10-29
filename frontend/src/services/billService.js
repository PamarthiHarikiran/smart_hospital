import api from './api';

export const billService = {
  createBill: async (data) => {
    return await api.post('/bills', data);
  },

  getBills: async (params = {}) => {
    return await api.get('/bills', { params });
  },

  getBillById: async (id) => {
    return await api.get(`/bills/${id}`);
  },

  updateBill: async (id, data) => {
    return await api.put(`/bills/${id}`, data);
  },

  processPayment: async (id, paymentData = {}) => {
    return await api.put(`/bills/${id}/payment`, paymentData);
  },
};
