import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/API';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: any;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.LOGIN, data);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
    }
    if (response.data.user) {
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post(API_ENDPOINTS.REGISTER, data);
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};