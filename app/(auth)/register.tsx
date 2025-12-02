import { useRouter, Link } from 'expo-router';
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
import { authService, RegisterData } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterData>({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof RegisterData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    try {
      setLoading(true);
      await authService.register(form);
      Toast.show({ type: 'success', text1: 'Account created', text2: 'Please sign in.' });
      router.replace('/(auth)/login');
    } catch (error: any) {
      console.log('Register error:', error?.response?.data || error?.message);
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error?.response?.data?.message || 'Try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your smarter money journey.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign up</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#9e9e9e"
            value={form.name}
            onChangeText={(v) => handleChange('name', v)}
          />

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

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign up'}</Text>
          </TouchableOpacity>

          <View style={styles.footerText}>
            <Text style={styles.smallText}>Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={styles.linkText}>Sign in</Text>
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
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#e0f2f1',
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
    color: '#1b5e20',
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
    backgroundColor: '#2e7d32',
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
    color: '#2e7d32',
  },
});


