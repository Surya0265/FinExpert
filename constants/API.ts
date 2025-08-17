export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  PROFILE: '/auth/profile',
  
  // Expenses
  ADD_EXPENSE: '/expenses/addexpenses',
  GET_EXPENSES: '/expenses/getexpenses',
  GET_EXPENSES_BY_PERIOD: '/expenses/expenses',
  GET_EXPENSES_BY_CATEGORY: '/expenses/expenses/category-wise',
  UPDATE_EXPENSE: '/expenses/expenses',
  DELETE_EXPENSE: '/expenses/expenses',
  
  // Budget
  SET_BUDGET: '/budgets/set',
  GET_BUDGET_ALERTS: '/budgets/alerts',
  GET_BUDGET_ADVICE: '/budgets/advice',
  
  // Reports
  DOWNLOAD_REPORT: '/report/download-report',
  SEND_REPORT: '/report/send-report',
};