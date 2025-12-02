import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<'(auth)' | '(tabs)' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthed = await authService.isAuthenticated();
      setInitialRoute(isAuthed ? '(tabs)' : '(auth)');
    };

    checkAuth();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return <Redirect href={initialRoute === '(tabs)' ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}


