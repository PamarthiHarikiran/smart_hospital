import api from './api';

export const admissionService = {
  createAdmission: async (data) => {
    return await api.post('/admissions', data);
  },

  getAdmissions: async (params = {}) => {
    return await api.get('/admissions', { params });
  },

  getAdmissionById: async (id) => {
    return await api.get(`/admissions/${id}`);
  },

  updateAdmission: async (id, data) => {
    return await api.put(`/admissions/${id}`, data);
  },

  dischargePatient: async (id) => {
    return await api.put(`/admissions/${id}/discharge`);
  },
};
