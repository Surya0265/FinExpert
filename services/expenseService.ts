import api from './api';
import { API_ENDPOINTS } from '@/constants/API';

export interface Expense {
  expense_id: string;
  amount: number;
  category: string;
  date: string;
}

export interface AddExpenseData {
  amount: number;
  category: string;
}

export interface ChartData {
  date?: string;
  category?: string;
  amount: number;
}

export const expenseService = {
  async addExpense(data: AddExpenseData): Promise<Expense> {
    const response = await api.post(API_ENDPOINTS.ADD_EXPENSE, data);
    return response.data;
  },

  async getExpenses(): Promise<Expense[]> {
    const response = await api.get(API_ENDPOINTS.GET_EXPENSES);
    return response.data;
  },

  async getExpensesByPeriod(period: 'week' | 'month'): Promise<{ data: ChartData[] }> {
    const response = await api.get(`${API_ENDPOINTS.GET_EXPENSES_BY_PERIOD}/${period}`);
    return response.data;
  },

  async getExpensesByCategory(): Promise<{ data: ChartData[] }> {
    const response = await api.get(API_ENDPOINTS.GET_EXPENSES_BY_CATEGORY);
    return response.data;
  },

  async updateExpense(expenseId: string, data: AddExpenseData): Promise<void> {
    await api.put(`${API_ENDPOINTS.UPDATE_EXPENSE}/${expenseId}`, data);
  },

  async deleteExpense(expenseId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.DELETE_EXPENSE}/${expenseId}`);
  },
};