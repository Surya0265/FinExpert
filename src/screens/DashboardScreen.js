import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import { expensesAPI, budgetAPI } from '../services/api';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budgetAlerts, setBudgetAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadExpenses(),
        loadWeeklyData(),
        loadCategoryData(),
        loadBudgetAlerts(),
      ]);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const response = await expensesAPI.getExpenses();
      const expenseData = response.data;
      setExpenses(expenseData);
      
      const total = expenseData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const response = await expensesAPI.getExpensesByPeriod('week');
      const data = response.data.data || [];
      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadCategoryData = async () => {
    try {
      const response = await expensesAPI.getExpensesByCategory();
      const data = response.data.data || [];
      setCategoryData(data);
    } catch (error) {
      console.error('Error loading category data:', error);
    }
  };

  const loadBudgetAlerts = async () => {
    try {
      const response = await budgetAPI.getBudgetAlerts();
      setBudgetAlerts(response.data.alerts || {});
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
    style: {
      borderRadius: theme.borderRadius.md,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const pieChartData = categoryData.map((item, index) => ({
    name: item.category,
    amount: parseFloat(item.amount),
    color: [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
      theme.colors.info,
      theme.colors.warning,
    ][index % 5],
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const lineChartData = {
    labels: weeklyData.slice(-7).map(item => 
      new Date(item.date).toLocaleDateString('en', { weekday: 'short' })
    ),
    datasets: [
      {
        data: weeklyData.slice(-7).map(item => parseFloat(item.amount)),
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <Animatable.View animation="fadeInUp" duration={800}>
      <TouchableOpacity style={styles.statCard} onPress={onPress}>
        <LinearGradient
          colors={[color, `${color}CC`]}
          style={styles.statCardGradient}
        >
          <View style={styles.statCardContent}>
            <View style={styles.statCardIcon}>
              <Ionicons name={icon} size={24} color={theme.colors.textLight} />
            </View>
            <View style={styles.statCardText}>
              <Text style={styles.statCardTitle}>{title}</Text>
              <Text style={styles.statCardValue}>{value}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.colors.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon="wallet"
            color={theme.colors.primary}
            onPress={() => navigation.navigate('Expenses')}
          />
          
          <StatCard
            title="This Month"
            value={`$${weeklyData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)}`}
            icon="calendar"
            color={theme.colors.secondary}
            onPress={() => navigation.navigate('Reports')}
          />
        </View>

        {Object.keys(budgetAlerts).length > 0 && (
          <Animatable.View animation="fadeInUp" duration={800} delay={200}>
            <View style={styles.alertsContainer}>
              <Text style={styles.sectionTitle}>Budget Alerts</Text>
              {Object.entries(budgetAlerts).map(([category, alert]) => (
                <View key={category} style={styles.alertCard}>
                  <Ionicons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))}
            </View>
          </Animatable.View>
        )}

        {weeklyData.length > 0 && (
          <Animatable.View animation="fadeInUp" duration={800} delay={400}>
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Weekly Spending</Text>
              <LineChart
                data={lineChartData}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          </Animatable.View>
        )}

        {pieChartData.length > 0 && (
          <Animatable.View animation="fadeInUp" duration={800} delay={600}>
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              <PieChart
                data={pieChartData}
                width={width - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </View>
          </Animatable.View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Expenses')}
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Budget')}
            >
              <Ionicons name="pie-chart" size={24} color={theme.colors.secondary} />
              <Text style={styles.actionButtonText}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textLight,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textLight,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  statCardGradient: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardIcon: {
    marginRight: theme.spacing.sm,
  },
  statCardText: {
    flex: 1,
  },
  statCardTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    opacity: 0.8,
  },
  statCardValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textLight,
  },
  alertsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  alertText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  chartContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  quickActions: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  actionButtonText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
});

export default DashboardScreen;