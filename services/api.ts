import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
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
      await SecureStore.deleteItemAsync('userToken');
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please login again',
      });
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string }) => 
    api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

// Expenses API
export const expensesAPI = {
  getExpenses: () => api.get('/expenses/getexpenses'),
  addExpense: (expense: { amount: number; category: string }) => 
    api.post('/expenses/addexpenses', expense),
  updateExpense: (id: string, expense: { amount: number; category: string }) => 
    api.put(`/expenses/expenses/${id}`, expense),
  deleteExpense: (id: string) => api.delete(`/expenses/expenses/${id}`),
  getExpensesByPeriod: (period: string) => api.get(`/expenses/expenses/${period}`),
  getExpensesByCategory: () => api.get('/expenses/expenses/category-wise'),
};

// Budget API
export const budgetAPI = {
  setBudget: (budgetData: { total_amount: number; manual_allocations?: any }) => 
    api.post('/budgets/set', budgetData),
  getBudgetAlerts: () => api.get('/budgets/alerts'),
  getBudgetAdvice: (period: string) => api.get(`/budgets/advice?period=${period}`),
};

// Reports API
export const reportsAPI = {
  downloadReport: (days: number) => api.get(`/report/download-report?days=${days}`),
  sendReportByEmail: (data: { email: string; days: number }) => 
    api.post('/report/send-report', data),
};

export default api;