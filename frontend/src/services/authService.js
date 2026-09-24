import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  }
};
