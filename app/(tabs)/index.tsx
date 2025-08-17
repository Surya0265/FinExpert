import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, TrendingUp, TrendingDown, CircleAlert as AlertCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { expenseService, Expense } from '@/services/expenseService';
import { budgetService } from '@/services/budgetService';
import ExpenseCard from '@/components/ExpenseCard';
import StatCard from '@/components/StatCard';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [alerts, setAlerts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    animateIn();
  }, []);

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

  const loadData = async () => {
    try {
      const [expensesData, alertsData] = await Promise.all([
        expenseService.getExpenses(),
        budgetService.getBudgetAlerts().catch(() => ({ alerts: {} })),
      ]);
      
      setExpenses(expensesData.slice(0, 5)); // Show only recent 5 expenses
      setAlerts(alertsData.alerts || {});
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateStats = () => {
    const today = new Date();
    const thisMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === today.getMonth() && 
             expenseDate.getFullYear() === today.getFullYear();
    });
    
    const lastMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1);
      return expenseDate.getMonth() === lastMonthDate.getMonth() && 
             expenseDate.getFullYear() === lastMonthDate.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    const lastMonthTotal = lastMonth.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);

    return {
      thisMonthTotal,
      lastMonthTotal,
      totalExpenses,
      expenseCount: expenses.length,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
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
          <Text style={styles.greeting}>Good Morning!</Text>
          <Text style={styles.welcomeText}>Welcome back to FinExpert</Text>
          
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Expenses</Text>
            <Text style={styles.balanceAmount}>${stats.totalExpenses.toFixed(2)}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Budget Alerts */}
        {Object.keys(alerts).length > 0 && (
          <Animated.View
            style={[
              styles.alertsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.alertHeader}>
              <AlertCircle size={20} color={Colors.warning} />
              <Text style={styles.alertTitle}>Budget Alerts</Text>
            </View>
            {Object.entries(alerts).map(([category, message], index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertText}>{message}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <StatCard
            title="This Month"
            value={`$${stats.thisMonthTotal.toFixed(2)}`}
            icon={<DollarSign size={24} color={Colors.primary} />}
            trend={stats.thisMonthTotal > stats.lastMonthTotal ? 'up' : 'down'}
            trendValue={`${Math.abs(((stats.thisMonthTotal - stats.lastMonthTotal) / (stats.lastMonthTotal || 1)) * 100).toFixed(1)}%`}
          />
          <StatCard
            title="Total Transactions"
            value={stats.expenseCount.toString()}
            icon={<TrendingUp size={24} color={Colors.info} />}
          />
        </Animated.View>

        {/* Recent Expenses */}
        <Animated.View
          style={[
            styles.expensesContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.length > 0 ? (
            expenses.map((expense, index) => (
              <ExpenseCard key={expense.expense_id} expense={expense} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your expenses to see them here</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.textLight,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.textLight,
    opacity: 0.9,
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textLight,
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: Colors.textLight,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  alertsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text,
    marginLeft: 8,
  },
  alertItem: {
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  expensesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});