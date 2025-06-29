import { Platform } from 'react-native';

// Storage utility that works across platforms
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const { default: SecureStore } = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const { default: SecureStore } = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const { default: SecureStore } = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  },
};