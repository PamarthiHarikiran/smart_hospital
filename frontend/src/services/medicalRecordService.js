import api from './api';

export const medicalRecordService = {
  createMedicalRecord: async (data) => {
    return await api.post('/medical-records', data);
  },

  getMedicalRecords: async (params = {}) => {
    return await api.get('/medical-records', { params });
  },

  getMedicalRecordById: async (id) => {
    return await api.get(`/medical-records/${id}`);
  },

  updateMedicalRecord: async (id, data) => {
    return await api.put(`/medical-records/${id}`, data);
  },
};
