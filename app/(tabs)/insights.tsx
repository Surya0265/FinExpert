import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
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
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#4830D3', '#7C4DFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Financial Insights</Text>
                <Text style={styles.headerSubtitle}>Get personalized budgeting advice.</Text>
              </View>
              <View style={styles.iconContainer}>
                <Sparkles size={24} color="#ffffff" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentBody}>
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
                <ActivityIndicator color="#5B4DBC" size="large" style={{ marginTop: 16 }} />
              ) : (
                <>
                  <View style={styles.markdownContainer}>
                    <Markdown 
                      style={markdownStyles}
                      rules={{
                        heading1: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 22, fontFamily: 'PoppinsSemiBold', color: '#4830D3', marginTop: 16, marginBottom: 12, fontWeight: 'bold' }}>
                            {children}
                          </Text>
                        ),
                        heading2: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 20, fontFamily: 'PoppinsSemiBold', color: '#4830D3', marginTop: 14, marginBottom: 10, fontWeight: 'bold' }}>
                            {children}
                          </Text>
                        ),
                        heading3: (node, children) => (
                          <Text key={node.key} style={{ fontSize: 18, fontFamily: 'PoppinsSemiBold', color: '#4830D3', marginTop: 12, marginBottom: 8, fontWeight: 'bold' }}>
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
  content: {
    paddingBottom: 150,
  },
  contentBody: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
    marginBottom: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#EDE7F6',
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
    backgroundColor: '#5B4DBC',
  },
  toggleText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    color: '#5B4DBC',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontFamily: 'PoppinsSemiBold',
  },
  generateButton: {
    backgroundColor: '#5B4DBC',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonDisabled: {
    backgroundColor: '#B39DDB',
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
    color: '#4830D3',
    marginBottom: 12,
  },
  markdownContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 8,
    color: '#4830D3',
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
    color: '#4830D3',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  heading2: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
    marginTop: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  heading3: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  heading4: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  heading5: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  heading6: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
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
    color: '#5B4DBC',
    marginRight: 8,
  },
  list_item: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  strong: {
    fontFamily: 'PoppinsSemiBold',
    color: '#4830D3',
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
    color: '#5B4DBC',
    textDecorationLine: 'underline',
  },
  blockquote: {
    borderLeftColor: '#4830D3',
    borderLeftWidth: 4,
    paddingLeft: 12,
    color: '#424242',
  },
});


