import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    return await api.get('/users', { params });
  },

  getDoctors: async (params = {}) => {
    return await api.get('/users/doctors', { params });
  },

  getUserById: async (id) => {
    return await api.get(`/users/${id}`);
  },

  updateUser: async (id, data) => {
    return await api.put(`/users/${id}`, data);
  },

  deleteUser: async (id) => {
    return await api.delete(`/users/${id}`);
  },
};
