import api from './api';
import { clearAccessToken, setAccessToken } from './tokenStorage';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setAccessToken(response.data.access_token, response.data.token_type);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: () => {
    clearAccessToken();
  }
};
