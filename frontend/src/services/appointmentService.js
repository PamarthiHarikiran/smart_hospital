import api from './api';

export const appointmentService = {
  getAvailableSlots: async (doctorId, date) => {
    return await api.get('/appointments/available-slots', {
      params: { doctorId, date },
    });
  },

  createAppointment: async (data) => {
    return await api.post('/appointments', data);
  },

  getAppointments: async (params = {}) => {
    return await api.get('/appointments', { params });
  },

  getAppointmentById: async (id) => {
    return await api.get(`/appointments/${id}`);
  },

  updateAppointment: async (id, data) => {
    return await api.put(`/appointments/${id}`, data);
  },

  deleteAppointment: async (id) => {
    return await api.delete(`/appointments/${id}`);
  },
};
