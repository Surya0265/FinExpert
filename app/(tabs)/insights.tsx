import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { budgetService, AdviceResponse } from '../../services/budgetService';

type AdvicePeriod = 'week' | 'month';

export default function InsightsScreen() {
  const [period, setPeriod] = useState<AdvicePeriod>('week');
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewlyGenerated, setIsNewlyGenerated] = useState(false);

  // Load cached advice on mount
  useEffect(() => {
    loadCachedAdvice();
  }, []);

  const loadCachedAdvice = async () => {
    try {
      const cached = await AsyncStorage.getItem('cachedAdvice');
      if (cached) {
        const parsedAdvice = JSON.parse(cached);
        setAdvice(parsedAdvice);
        setIsNewlyGenerated(false);
      }
    } catch (error) {
      console.error('Error loading cached advice:', error);
    }
  };

  const fetchAdvice = async (selected: AdvicePeriod) => {
    try {
      setLoading(true);
      const response = await budgetService.getBudgetAdvice(selected);
      setAdvice(response);
      setIsNewlyGenerated(true);
      
      // Save advice to database
      try {
        await budgetService.saveAdvice(response.advice, selected);
      } catch (saveError) {
        console.error('Error saving advice to DB:', saveError);
      }
      
      // Cache the advice locally
      await AsyncStorage.setItem('cachedAdvice', JSON.stringify(response));
      Toast.show({
        type: 'success',
        text1: 'Advice generated',
        text2: 'Updated with latest insights.',
      });
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

  const handleGenerateAdvice = () => {
    fetchAdvice(period);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Financial Insights</Text>
        <Text style={styles.subtitle}>Get personalized budgeting advice and recommendations.</Text>

        <Text style={styles.sectionLabel}>Select Timeline</Text>
        <View style={styles.toggleGroup}>
          {(['week', 'month'] as AdvicePeriod[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.toggleButton, period === item && styles.toggleButtonActive]}
              onPress={() => setPeriod(item)}
              disabled={loading}
            >
              <Text style={[styles.toggleText, period === item && styles.toggleTextActive]}>
                {item === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerateAdvice}
          disabled={loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? 'Generating...' : 'Generate Advice'}
          </Text>
        </TouchableOpacity>

        {advice?.advice && (
          <View style={styles.adviceSection}>
            {!isNewlyGenerated && (
              <Text style={styles.lastAdviceTitle}>Last Advice</Text>
            )}
            <View style={styles.card}>
              {loading ? (
                <ActivityIndicator color="#2e7d32" size="large" style={{ marginTop: 16 }} />
              ) : (
                <>
                  <View style={styles.markdownContainer}>
                    <Markdown 
                      style={markdownStyles}
                      rules={{
                        heading1: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 22, fontFamily: 'PoppinsSemiBold', color: '#1b5e20', marginTop: 16, marginBottom: 12, fontWeight: 'bold' }}>
                            {children}
                          </Text>
                        ),
                        heading2: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 20, fontFamily: 'PoppinsSemiBold', color: '#1b5e20', marginTop: 14, marginBottom: 10, fontWeight: 'bold' }}>
                            {children}
                          </Text>
                        ),
                        heading3: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 18, fontFamily: 'PoppinsSemiBold', color: '#1b5e20', marginTop: 12, marginBottom: 8, fontWeight: 'bold' }}>
                            {children}
                          </Text>
                        ),
                      }}
                    >
                      {advice.advice}
                    </Markdown>
                  </View>
                  <Text style={styles.adviceTimestamp}>
                    Generated for the last {period === 'week' ? '7 days' : '30 days'}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
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
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginBottom: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
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
  generateButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  generateButtonText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  adviceSection: {
    marginTop: 24,
  },
  lastAdviceTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginBottom: 12,
  },
  markdownContainer: {
    marginBottom: 12,
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
    color: '#1b5e20',
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    lineHeight: 20,
  },
  adviceTimestamp: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#9e9e9e',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    lineHeight: 22,
  },
  text: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
  },
  paragraph: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    lineHeight: 22,
  },
  heading1: {
    fontSize: 22,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  heading2: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  heading3: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  heading4: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  heading5: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  heading6: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginTop: 6,
    marginBottom: 2,
    fontWeight: 'bold',
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
    color: '#424242',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  fence: {
    backgroundColor: '#f5f5f5',
    color: '#424242',
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  link: {
    color: '#2e7d32',
    textDecorationLine: 'underline',
  },
  blockquote: {
    borderLeftColor: '#1b5e20',
    borderLeftWidth: 4,
    paddingLeft: 12,
    color: '#424242',
  },
});


