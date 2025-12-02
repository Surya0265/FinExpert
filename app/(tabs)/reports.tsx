import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/API';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);

  const openDownload = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Please login again.' });
        return;
      }
      const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_REPORT}`;
      await WebBrowser.openBrowserAsync(`${url}?token=${token}`);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not open report' });
    } finally {
      setLoading(false);
    }
  };

  // send-report is typically for email; we just call the endpoint without body
  const sendEmail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Please login again.' });
        return;
      }
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEND_REPORT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed');
      Toast.show({ type: 'success', text1: data.message || 'Report sent to your email' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Could not send report' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Generate and access detailed financial reports.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Download PDF report</Text>
        <Text style={styles.cardText}>
          Opens a PDF summary of your recent expenses and budgets in the browser.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openDownload} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Opening...' : 'Open report'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Email me the report</Text>
        <Text style={styles.cardText}>We will generate and send the report to your email.</Text>
        <TouchableOpacity style={styles.buttonSecondary} onPress={sendEmail} disabled={loading}>
          <Text style={styles.buttonSecondaryText}>
            {loading ? 'Sending...' : 'Send to email'}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 4,
    color: '#263238',
  },
  cardText: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  buttonSecondary: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  buttonSecondaryText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#2e7d32',
  },
});


