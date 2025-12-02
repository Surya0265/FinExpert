import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/API';
import { router } from 'expo-router';

const AUTH_FREE_ENDPOINTS = ['/auth/login', '/auth/register'];
let isRedirectingToLogin = false;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    console.log('[API] Token from storage:', token ? 'EXISTS' : 'MISSING');
    const endpoint = config.url ?? '';
    const requiresAuth = !AUTH_FREE_ENDPOINTS.some((path) => endpoint.startsWith(path));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Authorization header set');
    } else if (requiresAuth) {
      console.log('[API] WARNING: No token found - redirecting to login');
      await AsyncStorage.removeItem('authToken');
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        router.replace('/(auth)/login');
        setTimeout(() => {
          isRedirectingToLogin = false;
        }, 500);
      }
      return Promise.reject({
        response: {
          status: 401,
          data: { message: 'Authentication required' },
        },
      });
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[API] Session expired - redirecting to login');
      await AsyncStorage.removeItem('authToken');
      // Redirect to login page
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);

export default api;