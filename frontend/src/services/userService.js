import api from './api';

export const userService = {
  getProfile: async () => {
    // const response = await api.get('/users/me');
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ name: 'Student User', email: 'student@example.com' }), 500));
  },
  getDashboardMetrics: async () => {
    // const response = await api.get('/users/me/dashboard');
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ readiness_score: 0, recent_ats_score: 0 }), 500));
  }
};
