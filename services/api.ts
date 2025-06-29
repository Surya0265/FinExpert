import axios from 'axios';

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
      // Import SecureStore dynamically to avoid issues on web
      const { default: SecureStore } = await import('expo-secure-store');
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Handle case where SecureStore is not available (web platform)
      console.log('SecureStore not available on this platform');
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
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
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
export const expenseAPI = {
  getExpenses: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    startDate?: string; 
    endDate?: string; 
  }) =>
    api.get('/expenses', { params }),
  
  createExpense: (expense: {
    amount: number;
    description: string;
    category: string;
    date: string;
  }) =>
    api.post('/expenses', expense),
  
  updateExpense: (id: string, expense: Partial<{
    amount: number;
    description: string;
    category: string;
    date: string;
  }>) =>
    api.put(`/expenses/${id}`, expense),
  
  deleteExpense: (id: string) =>
    api.delete(`/expenses/${id}`),
  
  getExpenseById: (id: string) =>
    api.get(`/expenses/${id}`),
};

// Budget API endpoints
export const budgetAPI = {
  getBudgets: () =>
    api.get('/budgets'),
  
  createBudget: (budget: {
    category: string;
    amount: number;
    period: 'monthly' | 'weekly' | 'yearly';
  }) =>
    api.post('/budgets', budget),
  
  updateBudget: (id: string, budget: Partial<{
    category: string;
    amount: number;
    period: 'monthly' | 'weekly' | 'yearly';
  }>) =>
    api.put(`/budgets/${id}`, budget),
  
  deleteBudget: (id: string) =>
    api.delete(`/budgets/${id}`),
  
  getBudgetById: (id: string) =>
    api.get(`/budgets/${id}`),
};

// Reports API endpoints
export const reportsAPI = {
  getExpenseReport: (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'category' | 'date';
  }) =>
    api.get('/reports/expenses', { params }),
  
  getBudgetReport: (params: {
    startDate: string;
    endDate: string;
  }) =>
    api.get('/reports/budget', { params }),
  
  getFinancialSummary: (params: {
    period: 'week' | 'month' | 'year';
  }) =>
    api.get('/reports/summary', { params }),
  
  exportReport: (params: {
    type: 'expenses' | 'budget' | 'summary';
    format: 'pdf' | 'csv';
    startDate: string;
    endDate: string;
  }) =>
    api.get('/reports/export', { 
      params,
      responseType: 'blob'
    }),
};

export default api;