import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Calendar, TrendingUp, ChartPie as PieChartIcon } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { expenseService, ChartData } from '@/services/expenseService';
import { budgetService } from '@/services/budgetService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const chartWidth = width - 48;

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [barChartData, setBarChartData] = useState<ChartData[]>([]);
  const [pieChartData, setPieChartData] = useState<ChartData[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadAnalyticsData();
    animateIn();
  }, [selectedPeriod]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [barData, pieData, adviceData] = await Promise.all([
        expenseService.getExpensesByPeriod(selectedPeriod),
        expenseService.getExpensesByCategory(),
        budgetService.getBudgetAdvice(selectedPeriod).catch(() => ({ advice: 'No AI advice available at the moment.' })),
      ]);

      setBarChartData(barData.data || []);
      setPieChartData(pieData.data || []);
      setAiAdvice(adviceData.advice || 'No AI advice available at the moment.');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load analytics data',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBarChartData = () => {
    if (!barChartData.length) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const labels = barChartData.map(item => {
      if (item.date) {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return 'N/A';
    });

    const data = barChartData.map(item => item.amount);

    return {
      labels: labels.slice(0, 7), // Show max 7 labels
      datasets: [{ data: data.slice(0, 7) }],
    };
  };

  const formatPieChartData = () => {
    if (!pieChartData.length) {
      return [
        {
          name: 'No Data',
          population: 1,
          color: Colors.textSecondary,
          legendFontColor: Colors.textSecondary,
          legendFontSize: 12,
        },
      ];
    }

    return pieChartData.map((item, index) => ({
      name: item.category || 'Unknown',
      population: item.amount,
      color: Colors.chart.colors[index % Colors.chart.colors.length],
      legendFontColor: Colors.text,
      legendFontSize: 12,
    }));
  };

  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(33, 33, 33, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.header}>
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Insights into your spending</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <Animated.View
          style={[
            styles.periodSelector,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'week' && styles.periodButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === 'month' && styles.periodButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bar Chart */}
        <Animated.View
          style={[
            styles.chartContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <TrendingUp size={20} color={Colors.primary} />
            <Text style={styles.chartTitle}>Spending Trend</Text>
          </View>
          <BarChart
            data={formatBarChartData()}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </Animated.View>

        {/* Pie Chart */}
        <Animated.View
          style={[
            styles.chartContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <PieChartIcon size={20} color={Colors.primary} />
            <Text style={styles.chartTitle}>Category Breakdown</Text>
          </View>
          <PieChart
            data={formatPieChartData()}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Animated.View>

        {/* AI Advice */}
        <Animated.View
          style={[
            styles.adviceContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.adviceTitle}>💡 AI Financial Advice</Text>
          <Text style={styles.adviceText}>{aiAdvice}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.textLight,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textLight,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.textLight,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text,
    marginLeft: 8,
  },
  chart: {
    borderRadius: 16,
  },
  adviceContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  adviceTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text,
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});