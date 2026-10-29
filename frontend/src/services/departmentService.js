import api from './api';

export const departmentService = {
  getDepartments: async (params = {}) => {
    return await api.get('/departments', { params });
  },

  getDepartmentById: async (id) => {
    return await api.get(`/departments/${id}`);
  },

  createDepartment: async (data) => {
    return await api.post('/departments', data);
  },

  updateDepartment: async (id, data) => {
    return await api.put(`/departments/${id}`, data);
  },

  deleteDepartment: async (id) => {
    return await api.delete(`/departments/${id}`);
  },

  recommendDepartment: async (symptoms) => {
    return await api.post('/departments/recommend', { symptoms });
  },
};
