import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText } from 'lucide-react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/API';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState('1');

  const downloadReport = async () => {
    try {
      const monthsNum = parseInt(months);
      if (!monthsNum || isNaN(monthsNum) || monthsNum <= 0) {
        Toast.show({ type: 'error', text1: 'Please enter a valid number of months' });
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Please login again.' });
        return;
      }

      const days = monthsNum * 30; // Convert months to days
      const url = `${API_BASE_URL}${API_ENDPOINTS.DOWNLOAD_REPORT}?days=${days}`;
      
      // Create documents directory if it doesn't exist
      const documentsDir = `${FileSystem.documentDirectory}FinExpertReports/`;
      const dirInfo = await FileSystem.getInfoAsync(documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      }
      
      const fileName = `Financial_Report_${monthsNum}months_${new Date().toISOString().split('T')[0]}.pdf`;
      const fileUri = `${documentsDir}${fileName}`;
      
      // Download file to documents directory
      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadResult.status !== 200) {
        Toast.show({ type: 'error', text1: 'Failed to download report' });
        return;
      }

      Toast.show({ 
        type: 'success', 
        text1: 'Report Downloaded!',
        text2: `Saved to: FinExpertReports/${fileName}`
      });
      
      // Show alert with file location
      Alert.alert(
        'Report Downloaded',
        `Your report has been saved to:\n\nFinExpertReports/${fileName}\n\nYou can access it from your device's file manager.`,
        [{ text: 'OK' }]
      );
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Could not download report' });
      console.error('Download error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#4830D3', '#7C4DFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Reports</Text>
                <Text style={styles.headerSubtitle}>Generate detailed financial reports.</Text>
              </View>
              <View style={styles.iconContainer}>
                <FileText size={24} color="#ffffff" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentBody}>
          <View style={styles.card}>
          <Text style={styles.cardTitle}>Download Financial Report as PDF</Text>
          <Text style={styles.cardText}>
            Specify how many months of expenses and budget data you want in your report.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number of Months:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1, 3, 6, 12"
              value={months}
              onChangeText={setMonths}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={downloadReport} 
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Generating...' : 'Download PDF Report'}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  safeHeader: {
    paddingTop: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  contentBody: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#5B4DBC',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EEFA',
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
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#263238',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#5B4DBC',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#B39DDB',
  },
  buttonText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});


