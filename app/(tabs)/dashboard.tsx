import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseService, ChartData } from '../../services/expenseService';
import { budgetService, AlertsResponse } from '../../services/budgetService';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { LogOut, ArrowUpRight, ArrowDownLeft, CreditCard, Bell, UserCircle, TrendingUp, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width - 32;

interface User {
  name: string;
  email?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodData, setPeriodData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<ChartData[]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('authToken');
            router.replace('/');
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const loadData = useCallback(async () => {
    try {
      console.log('[Dashboard] Loading data...');
      setError(null);
      
      // Fetch user info from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        // Fallback to a default user name
        setUser({ name: 'User' });
      }
      
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
      if (e.response?.status === 401 || e.response?.status === 404) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/(auth)/login');
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

  // Improved chart config with better scaling and darker colors
  const improvedChartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(40, 30, 130, ${opacity})`, // Darker blue
    barPercentage: 0.7,
    labelColor: (opacity = 1) => `rgba(66, 66, 66, ${opacity})`,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: '5',
      stroke: '#f0f0f0',
    },
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B4DBC" />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#4830D3', '#7C4DFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerWelcome}>Welcome, {user?.name}</Text>
              </View>
              <View style={styles.headerRightSection}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <LogOut color="#fff" size={18} />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.finexpertContainer}>
              <Text style={styles.finexpertTitle}>FinExpert</Text>
              <View style={styles.iconContainer}>
                <Wallet color="#fff" size={24} />
              </View>
            </View>

            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Total Spent (Week)</Text>
                
              </View>
              <Text style={styles.balanceAmount}>₹{totalSpent.toFixed(2)}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentBody}>
          {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#5B4DBC" />
          </View>
        ) : (
          <>
            {/* Quick Actions / Cards */}
            {/* Cards section removed as requested */}

            {/* Pie Chart - Category Distribution (First) */}
            <View style={styles.card}>
              <View style={styles.categoryHeader}>
                <Text style={styles.cardTitle}>Spending by Category</Text>
                <Text style={styles.totalLabel}>Total: ₹{totalByCategory.toFixed(2)}</Text>
              </View>
              {categoryData.length > 0 && categoryData.some((item) => item.amount > 0) ? (
                <>
                  <PieChart
                    data={pieData}
                    width={screenWidth - 48}
                    height={220}
                    accessor="amount"
                    backgroundColor="#ffffff"
                    paddingLeft="0"
                    chartConfig={improvedChartConfig}
                    center={[10, 0]}
                    absolute
                  />
                </>
              ) : (
                <Text style={styles.emptyText}>No category data available.</Text>
              )}
            </View>

            {/* Bar Chart - Weekly Spending (Second) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Weekly Spending Trend</Text>
              {periodData.length > 0 && periodData.some((item) => item.amount > 0) ? (
                <>
                  <View style={styles.barChartWrapper}>
                    <BarChart
                      data={chartData}
                      width={screenWidth - 48}
                      height={220}
                      chartConfig={improvedChartConfig}
                      style={styles.chart}
                      verticalLabelRotation={0}
                      showValuesOnTopOfBars={true}
                      fromZero={true}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      segments={4}
                      withInnerLines={true}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                    />
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>No expenses recorded yet.</Text>
              )}
            </View>

            {/* Budget Alerts */}
            {alerts && (
              <View style={[styles.card, styles.orangeCard]}>
                <Text style={[styles.cardTitle, styles.orangeCardTitle]}>Budget Alerts</Text>
                {Object.keys(alerts.alerts || {}).length > 0 ? (
                  Object.entries(alerts.alerts).map(([category, message]) => (
                    <View key={category} style={[styles.alertRow, styles.orangeAlertRow]}>
                      <View style={[styles.alertIcon, styles.orangeAlertIcon]}>
                        {/* Use Bell icon for alert */}
                        <Bell color="#fff" size={24} />
                      </View>
                      <View style={styles.alertContent}>
                        <Text style={[styles.alertCategory, styles.orangeAlertCategory, { fontSize: 18, color: '#fff' }]}>{category}</Text>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', fontFamily: 'PoppinsBold', marginTop: 6, marginBottom: 4 }}>
                          {message}
                        </Text>
                        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginVertical: 4 }} />
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, styles.orangeEmptyText]}>✓ No alerts right now. Keep it up!</Text>
                )}
              </View>
            )}
          </>
        )}
        </View>
      </ScrollView>
    </View>
  );
}

const PIE_COLORS = ['#5B4DBC', '#FF9F43', '#FF6B6B', '#4830D3', '#1DD1A1', '#54A0FF', '#5f27cd', '#ff9ff3'];

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeHeader: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 0,
  },
  finexpertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerWelcome: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerRightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
    justifyContent: 'flex-start',
  },
    finexpertTitle: {
      fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginRight: 0,
    marginTop: 0,
    textAlign: 'center',
  },
  iconContainer: {
    backgroundColor: '#FF8C42',
    borderRadius: 16,
    padding: 6,
    marginTop: -2,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'PoppinsBold',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
    lineHeight: 26,
  },
  // Removed duplicate headerSubtitle style
  headerUsername: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
  },
  balanceCard: {
    alignItems: 'center',
    paddingHorizontal: 4,
      paddingTop: 24,
    },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'PoppinsSemiBold',
    color: '#2E7D32',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 16,
    width: '48%',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#ffffff',
  },

  scrollContent: {
    paddingBottom: 150,
  },
  contentBody: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#263238',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#5B4DBC',
  },
  cardsScroll: {
    marginBottom: 24,
    overflow: 'visible',
  },
  creditCard: {
    width: 280,
    height: 170,
    borderRadius: 24,
    padding: 24,
    marginRight: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBank: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#ffffff',
  },
  cardNumber: {
    fontSize: 18,
    fontFamily: 'PoppinsRegular',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 20,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  cardBalance: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    color: '#ffffff',
  },
  mastercard: {
    flexDirection: 'row',
  },
  mcCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5B4DBC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0EEFA',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  barChartWrapper: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    paddingRight: 0,
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
    color: '#5B4DBC',
    backgroundColor: '#F0EEFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 20,
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
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertCategory: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#d32f2f',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  orangeCard: {
    backgroundColor: '#FF9800',
    borderColor: '#F57C00',
  },
  orangeCardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    fontSize: 18,
  },
  orangeAlertRow: {
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  orangeAlertIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orangeAlertCategory: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    fontSize: 15,
  },
  orangeAlertMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  orangeEmptyText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});


