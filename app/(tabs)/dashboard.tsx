import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expenseService, ChartData } from '../../services/expenseService';
import { budgetService, AlertsResponse } from '../../services/budgetService';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 32;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodData, setPeriodData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      console.log('[Dashboard] Loading data...');
      setError(null);
      
      const [weekExpenses, categoryExpenses, alertsRes] = await Promise.all([
        expenseService.getExpensesByPeriod('week'),
        expenseService.getExpensesByCategory(),
        budgetService.getBudgetAlerts(),
      ]);

      console.log('[Dashboard] Week expenses:', weekExpenses);
      console.log('[Dashboard] Category expenses:', categoryExpenses);
      console.log('[Dashboard] Alerts:', alertsRes);

      const normalizedPeriod = (weekExpenses.data || []).map((item: any) => ({
        ...item,
        amount: Number(item.amount) || parseFloat(item.total_spent) || 0,
        date: item.date
          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : item.label || '',
      }));

      const normalizedCategory = (categoryExpenses.data || []).map((item: any) => ({
        ...item,
        amount: Number(item.amount) || parseFloat(item.total_spent) || 0,
        category: item.category || item.name || 'Other',
      }));

      setPeriodData(normalizedPeriod);
      setCategoryData(normalizedCategory);
      setAlerts(alertsRes);

      console.log('[Dashboard] Normalized period:', normalizedPeriod);
      console.log('[Dashboard] Normalized category:', normalizedCategory);
    } catch (e: any) {
      console.error('[Dashboard] Error loading data:', e);
      if (e.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(e.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const chartData = {
    labels: periodData.map((d) => d.date || '').slice(0, 7),
    datasets: [{ 
      data: periodData.map((d) => d.amount || 0).slice(0, 7) || [0],
    }],
  };

  const pieData = categoryData
    .filter((c) => c.amount > 0)
    .map((c, index) => ({
      name: c.category || '',
      amount: c.amount,
      color: PIE_COLORS[index % PIE_COLORS.length],
      legendFontColor: '#424242',
      legendFontSize: 12,
    }));

  const totalSpent = periodData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalByCategory = categoryData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const maxAmount = Math.max(...periodData.map((d) => d.amount || 0), 1);

  // Improved chart config with better scaling
  const improvedChartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
    barPercentage: 0.7,
    labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
    decimalPlaces: 0,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Overview</Text>
        <Text style={styles.subtitle}>Your spending and budgets at a glance.</Text>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2e7d32" />
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Weekly</Text>
                <Text style={styles.summaryAmount}>₹{totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>By Category</Text>
                <Text style={styles.summaryAmount}>₹{totalByCategory.toFixed(2)}</Text>
              </View>
            </View>

            {/* Bar Chart - Weekly Spending */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weekly Spending Trend</Text>
              {periodData.length > 0 && periodData.some((item) => item.amount > 0) ? (
                <>
                  <View style={styles.barChartWrapper}>
                    <BarChart
                      data={chartData}
                      width={screenWidth}
                      height={220}
                      chartConfig={improvedChartConfig}
                      style={styles.chart}
                      verticalLabelRotation={45}
                      showValuesOnTopOfBars={true}
                      fromZero={true}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      segments={5}
                      withInnerLines={true}
                    />
                  </View>
                  <View style={styles.chartStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total</Text>
                      <Text style={styles.statValue}>₹{totalSpent.toFixed(0)}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Average</Text>
                      <Text style={styles.statValue}>₹{(totalSpent / Math.max(periodData.length, 1)).toFixed(0)}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Highest</Text>
                      <Text style={styles.statValue}>₹{maxAmount.toFixed(0)}</Text>
                    </View>
                  </View>
                  <Text style={styles.chartNote}>Last 7 days spending</Text>
                </>
              ) : (
                <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              )}
            </View>

            {/* Pie Chart - Category Distribution */}
            <View style={styles.card}>
              <View style={styles.categoryHeader}>
                <Text style={styles.cardTitle}>Spending by Category</Text>
                <Text style={styles.totalLabel}>Total: ₹{totalByCategory.toFixed(2)}</Text>
              </View>
              {categoryData.length > 0 && categoryData.some((item) => item.amount > 0) ? (
                <>
                  <PieChart
                    data={pieData}
                    width={screenWidth}
                    height={220}
                    accessor="amount"
                    backgroundColor="#ffffff"
                    paddingLeft="0"
                    chartConfig={chartConfig}
                  />
                  <View style={styles.categoryLegend}>
                    {categoryData
                      .filter((c) => c.amount > 0)
                      .map((c, index) => (
                        <View key={index} style={styles.legendRow}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: PIE_COLORS[index % PIE_COLORS.length] },
                            ]}
                          />
                          <Text style={styles.legendText}>
                            {c.category}: ₹{c.amount.toFixed(2)} (
                            {((c.amount / totalByCategory) * 100).toFixed(1)}%)
                          </Text>
                        </View>
                      ))}
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>No category data available.</Text>
              )}
            </View>

            {/* Budget Alerts */}
            {alerts && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Budget Alerts</Text>
                {Object.keys(alerts.alerts || {}).length > 0 ? (
                  Object.entries(alerts.alerts).map(([category, message]) => (
                    <View key={category} style={styles.alertRow}>
                      <Text style={styles.alertDot}>⚠️</Text>
                      <View style={styles.alertContent}>
                        <Text style={styles.alertCategory}>{category}</Text>
                        <Text style={styles.alertMessage}>{message}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>✓ No alerts right now. Keep it up!</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const PIE_COLORS = ['#2e7d32', '#66bb6a', '#a5d6a7', '#ffb74d', '#ef5350', '#29b6f6', '#ab47bc', '#ff7043'];

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#2e7d32',
  },
  propsForBackgroundLines: {
    strokeDasharray: '0',
    stroke: '#e0e0e0',
    strokeWidth: 1,
  },
};

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
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#ffffff',
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
    marginBottom: 12,
    color: '#263238',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#2e7d32',
    backgroundColor: '#f0f7f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  barChartWrapper: {
    marginVertical: 12,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  chartStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0f7f0',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#2e7d32',
  },
  chartNote: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: 8,
  },
  categoryLegend: {
    marginTop: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#424242',
    flex: 1,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 16,
  },
  loader: {
    marginTop: 48,
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#d32f2f',
  },
  alertRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertDot: {
    fontSize: 16,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertCategory: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#d32f2f',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
  },
});


