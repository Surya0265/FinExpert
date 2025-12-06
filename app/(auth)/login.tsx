import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, LoginData } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const router = useRouter();
  const [form, setForm] = useState<LoginData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LoginData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    try {
      setLoading(true);
      await authService.login(form);
      Toast.show({ type: 'success', text1: 'Welcome back!' });
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error?.response?.data?.message || 'Check your credentials and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#4830D3', '#7C4DFF']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>FinExpert</Text>
          <Text style={styles.subtitle}>Smart budgeting at your fingertips.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9e9e9e"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => handleChange('email', v)}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9e9e9e"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => handleChange('password', v)}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </TouchableOpacity>

          <View style={styles.footerText}>
            <Text style={styles.smallText}>New here? </Text>
            <Link href="/(auth)/register">
              <Text style={styles.linkText}>Create an account</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PoppinsBold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#EDE7F6',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 20,
    color: '#4830D3',
  },
  label: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#616161',
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#212121',
  },
  button: {
    backgroundColor: '#5B4DBC',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 16,
  },
  footerText: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  smallText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 12,
    color: '#757575',
  },
  linkText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 12,
    color: '#5B4DBC',
  },
});


