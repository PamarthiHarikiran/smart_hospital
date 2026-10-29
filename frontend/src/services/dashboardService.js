import api from './api';

export const dashboardService = {
  getAdminDashboard: async () => {
    return await api.get('/dashboard/admin');
  },

  getDoctorDashboard: async () => {
    return await api.get('/dashboard/doctor');
  },

  getPatientDashboard: async () => {
    return await api.get('/dashboard/patient');
  },

  getLabDashboard: async () => {
    return await api.get('/dashboard/lab');
  },

  getPharmacyDashboard: async () => {
    return await api.get('/dashboard/pharmacy');
  },
};
