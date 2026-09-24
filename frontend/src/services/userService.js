import api from './api';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  getDashboardMetrics: async () => {
    const response = await api.get('/users/me/dashboard');
    return response.data;
  }
};
