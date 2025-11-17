/**
 * API Service - Centralized API calls
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
