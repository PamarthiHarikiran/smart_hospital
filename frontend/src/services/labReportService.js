import api from './api';

export const labReportService = {
  createLabRequest: async (data) => {
    return await api.post('/lab-reports', data);
  },

  getLabReports: async (params = {}) => {
    return await api.get('/lab-reports', { params });
  },

  getLabReportById: async (id) => {
    return await api.get(`/lab-reports/${id}`);
  },

  updateLabReport: async (id, formData) => {
    return await api.put(`/lab-reports/${id}`, formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
};
