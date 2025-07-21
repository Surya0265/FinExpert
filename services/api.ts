import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '@/utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('userToken');
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
      // Handle unauthorized access
      await storage.removeItem('userToken');
      console.log('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { 
    name: string; 
    email: string; 
    password: string; 
  }) =>
    api.post('/auth/register', userData),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  getProfile: () =>
    api.get('/auth/profile'),
};

// Expense API endpoints
export const expensesAPI = {
  getExpenses: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    startDate?: string; 
    endDate?: string; 
  }) =>
    api.get('/expenses/getexpenses', { params }),
  
  addExpense: (expense: {
    amount: number;
    category: string;
  }) =>
    api.post('/expenses/addexpenses', expense),
  
  updateExpense: (id: string, expense: Partial<{
    amount: number;
    category: string;
  }>) =>
    api.put(`/expenses/expenses/${id}`, expense),
  
  deleteExpense: (id: string) =>
    api.delete(`/expenses/expenses/${id}`),
  
  getExpensesByPeriod: (period: string) =>
    api.get(`/expenses/expenses/${period}`),
  
  getExpensesByCategory: () =>
    api.get('/expenses/expenses/category-wise'),
};

// Budget API endpoints
export const budgetAPI = {
  setBudget: (budgetData: {
    total_amount: number;
  }) =>
    api.post('/budgets/set', budgetData),
  
  getBudgetAlerts: () =>
    api.get('/budgets/alerts'),
  
  getBudgetAdvice: (period: string) =>
    api.get(`/budgets/advice?period=${period}`),
};

// Reports API endpoints
export const reportsAPI = {
  downloadReport: (days: number) =>
    api.get(`/report/download-report?days=${days}`),
  
  sendReportByEmail: (data: {
    email: string;
    days: number;
  }) =>
    api.post('/report/send-report', data),
};

export default api;