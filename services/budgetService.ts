import api from './api';
import { API_ENDPOINTS } from '@/constants/API';

export interface BudgetData {
  budget_id?: string;
  budget_name?: string;
  total_amount: number;
  manual_allocations?: Record<string, number>;
  allocated_budget?: Record<string, number>;
  created_at?: string;
}

export interface BudgetResponse {
  message: string;
  allocatedBudget: Record<string, number>;
  budget_id: string;
  budget_name?: string;
  total_amount?: number;
}

export interface GetBudgetResponse {
  message: string;
  data: (BudgetData & { budget_id: string }) | null;
  allBudgets?: Array<BudgetData & { budget_id: string }>;
}

export interface AlertsResponse {
  message: string;
  alerts: Record<string, string>;
}

export interface AdviceResponse {
  message: string;
  advice: string;
}

export interface AIAllocationResponse {
  message: string;
  allocation: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export const budgetService = {
  async setBudget(data: BudgetData): Promise<BudgetResponse> {
    const response = await api.post(API_ENDPOINTS.SET_BUDGET, data);
    return response.data;
  },

  async getBudget(): Promise<GetBudgetResponse | null> {
    try {
      const response = await api.get(API_ENDPOINTS.GET_BUDGET);
      return response.data;
    } catch (error) {
      console.log('No budget found');
      return null;
    }
  },

  async deleteBudget(budgetId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.DELETE_BUDGET}/${budgetId}`);
  },

  async getBudgetAlerts(): Promise<AlertsResponse> {
    const response = await api.get(API_ENDPOINTS.GET_BUDGET_ALERTS);
    return response.data;
  },

  async getBudgetAdvice(period: 'week' | 'month'): Promise<AdviceResponse> {
    const response = await api.get(`${API_ENDPOINTS.GET_BUDGET_ADVICE}?period=${period}`);
    return response.data;
  },

  async getAIBudgetAllocation(data: { totalBudget: number; categories: string[] }): Promise<AIAllocationResponse> {
    const response = await api.post(API_ENDPOINTS.GET_AI_BUDGET_ALLOCATION, data);
    return response.data;
  },
};