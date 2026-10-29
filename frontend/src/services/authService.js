import api from './api';

export const authService = {
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },

  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  registerDoctor: async (doctorData) => {
    return await api.post('/doctors/register', doctorData);
  },

  loginDoctor: async (credentials) => {
    return await api.post('/doctors/login', credentials);
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  logout: async () => {
    return await api.post('/auth/logout');
  },

  updateProfile: async (formData) => {
    // If formData is FormData instance (for image file upload)
    return await api.put('/auth/profile', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
};
