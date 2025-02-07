import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  withCredentials: false,  // False olmalı
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - her istekte çalışır
instance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Request config:', config);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - her yanıtta çalışır
instance.interceptors.response.use(
  (response) => {
    console.log('Received response from:', response.config.url);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 