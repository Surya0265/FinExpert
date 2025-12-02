import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Markdown from 'react-native-markdown-display';
import { budgetService, AdviceResponse } from '../../services/budgetService';

type AdvicePeriod = 'week' | 'month';

export default function InsightsScreen() {
  const [period, setPeriod] = useState<AdvicePeriod>('week');
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async (selected: AdvicePeriod) => {
    try {
      setLoading(true);
      const response = await budgetService.getBudgetAdvice(selected);
      setAdvice(response);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Unable to fetch advice',
        text2: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice(period);
  }, []);

  const handlePeriodChange = (value: AdvicePeriod) => {
    setPeriod(value);
    fetchAdvice(value);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Financial Insights</Text>
        <Text style={styles.subtitle}>Personalized budgeting advice and recommendations.</Text>

        <View style={styles.toggleGroup}>
          {(['week', 'month'] as AdvicePeriod[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.toggleButton, period === item && styles.toggleButtonActive]}
              onPress={() => handlePeriodChange(item)}
              disabled={loading}
            >
              <Text style={[styles.toggleText, period === item && styles.toggleTextActive]}>
                {item === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Smart advice</Text>
          {loading ? (
            <ActivityIndicator color="#2e7d32" size="large" style={{ marginTop: 16 }} />
          ) : advice?.advice ? (
            <Markdown style={markdownStyles}>
              {advice.advice}
            </Markdown>
          ) : (
            <Text style={styles.adviceText}>No insights available yet.</Text>
          )}
        </View>
      </ScrollView>
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
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7d32',
  },
  toggleText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    color: '#2e7d32',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontFamily: 'PoppinsSemiBold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 8,
    color: '#263238',
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    lineHeight: 20,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    lineHeight: 22,
  },
  heading1: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#2e7d32',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#388e3c',
    marginTop: 10,
    marginBottom: 4,
  },
  bullet_list: {
    marginVertical: 8,
  },
  bullet_list_content: {
    marginLeft: 16,
  },
  bullet_list_icon: {
    color: '#2e7d32',
    marginRight: 8,
  },
  list_item: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  strong: {
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  em: {
    fontStyle: 'italic',
    color: '#424242',
  },
  hr: {
    backgroundColor: '#e0e0e0',
    height: 1,
    marginVertical: 12,
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    color: '#e91e63',
    fontSize: 13,
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    color: '#1b5e20',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#f5f5f5',
    color: '#1b5e20',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
});


