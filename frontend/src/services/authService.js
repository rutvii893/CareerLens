import api from './api';

export const authService = {
  login: async (credentials) => {
    // const response = await api.post('/auth/login', credentials);
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ token: 'dummy_token' }), 500));
  },
  register: async (userData) => {
    // const response = await api.post('/auth/register', userData);
    // return response.data;
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};
