export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:5000/api';

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  SET_BUDGET: '/budgets/set',
  GET_BUDGET: '/budgets/get',
  DELETE_BUDGET: '/budgets/delete',
  GET_BUDGET_ALERTS: '/budgets/alerts',
  GET_BUDGET_ADVICE: '/budgets/advice',
  SAVE_ADVICE: '/budgets/save-advice',
  GET_AI_BUDGET_ALLOCATION: '/budgets/ai-allocation',

  ADD_EXPENSE: '/expenses/addexpenses',
  GET_EXPENSES: '/expenses/getexpenses',
  GET_EXPENSES_BY_PERIOD: '/expenses',
  GET_EXPENSES_BY_CATEGORY: '/expenses/category-wise',
  UPDATE_EXPENSE: '/expenses',
  DELETE_EXPENSE: '/expenses',

  DOWNLOAD_REPORT: '/report/download-report',
} as const;

// More detailed endpoints for reference
export const EXPENSE_ENDPOINTS = {
  ADD: '/expenses/addexpenses',
  GET_ALL: '/expenses/getexpenses',
  BY_PERIOD: (period: string) => `/expenses/${period}`,
  BY_CATEGORY: '/expenses/category-wise',
  UPDATE: (id: string) => `/expenses/${id}`,
  DELETE: (id: string) => `/expenses/${id}`,
} as const;


