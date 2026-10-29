import api from './api';

export const prescriptionService = {
  createPrescription: async (data) => {
    return await api.post('/prescriptions', data);
  },

  getPrescriptions: async (params = {}) => {
    return await api.get('/prescriptions', { params });
  },

  getPrescriptionById: async (id) => {
    return await api.get(`/prescriptions/${id}`);
  },

  updatePrescription: async (id, data) => {
    return await api.put(`/prescriptions/${id}`, data);
  },
};
