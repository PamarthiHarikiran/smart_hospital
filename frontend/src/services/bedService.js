import api from './api';

export const bedService = {
  getBeds: async (params = {}) => {
    return await api.get('/beds', { params });
  },

  getBedOccupancy: async () => {
    return await api.get('/beds/occupancy');
  },

  getBedById: async (id) => {
    return await api.get(`/beds/${id}`);
  },

  createBed: async (data) => {
    return await api.post('/beds', data);
  },

  updateBed: async (id, data) => {
    return await api.put(`/beds/${id}`, data);
  },

  deleteBed: async (id) => {
    return await api.delete(`/beds/${id}`);
  },
};
