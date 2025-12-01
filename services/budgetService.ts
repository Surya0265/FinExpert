import api from './api';
import { API_ENDPOINTS } from '@/constants/API';

export interface BudgetData {
  total_amount: number;
  manual_allocations?: Record<string, number>;
}

export interface BudgetResponse {
  message: string;
  allocatedBudget: Record<string, number>;
}

export interface AlertsResponse {
  message: string;
  alerts: Record<string, string>;
}

export interface AdviceResponse {
  message: string;
  advice: string;
}

export const budgetService = {
  async setBudget(data: BudgetData): Promise<BudgetResponse> {
    const response = await api.post(API_ENDPOINTS.SET_BUDGET, data);
    return response.data;
  },

  async getBudgetAlerts(): Promise<AlertsResponse> {
    const response = await api.get(API_ENDPOINTS.GET_BUDGET_ALERTS);
    return response.data;
  },

  async getBudgetAdvice(period: 'week' | 'month'): Promise<AdviceResponse> {
    const response = await api.get(`${API_ENDPOINTS.GET_BUDGET_ADVICE}?period=${period}`);
    return response.data;
  },
};