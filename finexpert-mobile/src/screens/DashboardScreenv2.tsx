// screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import { useExpenseStore } from '../state/expenseStore';
import { useBudgetStore } from '../state/budgetStore';
import { lightTheme } from '../utils/theme';
import { formatCurrency, formatDate } from '../utils/validation';

const DashboardScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [weeklySpent, setWeeklySpent] = useState(0);

  const expenses = useExpenseStore((state) => state.expenses);
  const categoryExpenses = useExpenseStore((state) => state.categoryExpenses);
  const isLoadingExpenses = useExpenseStore((state) => state.isLoading);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const fetchCategoryExpenses = useExpenseStore((state) => state.fetchCategoryExpenses);

  const alerts = useBudgetStore((state) => state.alerts);
  const budgetAlerts = useBudgetStore((state) => state.budgetAlerts);
  const isLoadingBudget = useBudgetStore((state) => state.isLoading);
  const fetchBudgetAlerts = useBudgetStore((state) => state.fetchBudgetAlerts);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[DashboardScreen] Loading data...');
      await Promise.all([
        fetchExpenses(),
        fetchCategoryExpenses(),
        fetchBudgetAlerts(),
      ]);
    } catch (error) {
      console.error('[DashboardScreen] Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate totals
  useEffect(() => {
    if (expenses && expenses.length > 0) {
      const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      setTotalSpent(total);

      // Calculate weekly spent (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyTotal = expenses
        .filter((exp) => new Date(exp.date) >= sevenDaysAgo)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      setWeeklySpent(weeklyTotal);
    }
  }, [expenses]);

  // Pie chart data
  const pieData =
    categoryExpenses && categoryExpenses.length > 0
      ? categoryExpenses.map((item) => ({
          value: parseFloat(item.total_spent),
          label: item.category,
          svg: {
            fill: getCategoryColor(item.category),
          },
        }))
      : [];

  // Bar chart data
  const barData =
    categoryExpenses && categoryExpenses.length > 0
      ? categoryExpenses.map((item) => ({
          value: parseFloat(item.total_spent),
          label: item.category.substring(0, 3).toUpperCase(),
        }))
      : [];

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      Food: '#FF6B6B',
      Transport: '#4ECDC4',
      Entertainment: '#95E1D3',
      Utilities: '#F38181',
      Health: '#AA96DA',
      Shopping: '#FCBAD3',
      Education: '#A8E6CF',
      Other: '#FFD3B6',
    };
    return colors[category] || '#667eea';
  };

  const renderAlerts = () => {
    if (!alerts || Object.keys(alerts).length === 0) {
      return <Text style={styles.noAlertsText}>✓ All spending within budget</Text>;
    }

    return Object.entries(alerts).map(([category, message], index) => (
      <View key={index} style={styles.alertBox}>
        <Text style={styles.alertCategory}>{category}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
      </View>
    ));
  };

  const renderRecentExpenses = () => {
    if (!expenses || expenses.length === 0) {
      return <Text style={styles.noExpensesText}>No expenses yet</Text>;
    }

    const recent = expenses.slice(0, 5);
    return recent.map((expense, index) => (
      <View key={index} style={styles.expenseItem}>
        <View style={styles.expenseLeft}>
          <View
            style={[
              styles.expenseCategoryBadge,
              { backgroundColor: getCategoryColor(expense.category) },
            ]}
          >
            <Text style={styles.expenseCategoryText}>{expense.category[0]}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseCategory}>{expense.category}</Text>
            <Text style={styles.expenseDate}>
              {formatDate(new Date(expense.date))}
            </Text>
          </View>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(parseFloat(expense.amount))}</Text>
      </View>
    ));
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Weekly Spend</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(weeklySpent)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Expenses', { screen: 'AddExpense' })}
        >
          <Text style={styles.actionButtonText}>➕ Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Budget')}
        >
          <Text style={styles.actionButtonText}>💰 Set Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Pie Chart */}
      {pieData && pieData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.pieChartContainer}>
            <PieChart
              style={{ height: 250 }}
              data={pieData}
              innerRadius={0}
              outerRadius={80}
              labelRadius={100}
              sort={(a, b) => b.value - a.value}
            />
          </View>
          {/* Legend */}
          <View style={styles.legendContainer}>
            {categoryExpenses.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: getCategoryColor(item.category) },
                  ]}
                />
                <Text style={styles.legendLabel}>
                  {item.category} - {formatCurrency(parseFloat(item.total_spent))}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Bar Chart */}
      {barData && barData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Category Comparison</Text>
          <View style={styles.barChartContainer}>
            <YAxis
              data={barData.map((d) => d.value)}
              contentInset={{ top: 10, bottom: 10 }}
              svg={{
                fontSize: 10,
                fill: lightTheme.colors.textSecondary,
              }}
              numberOfTicks={5}
              formatLabel={(value) => `₹${Math.round(value)}`}
            />
            <BarChart
              style={{ flex: 1, marginLeft: 10 }}
              data={barData}
              yAccessor={({ item }) => item.value}
              svg={{ fill: lightTheme.colors.primary }}
              contentInset={{ top: 10, bottom: 10 }}
            >
              <Grid />
            </BarChart>
          </View>
          <XAxis
            data={barData}
            scale="ordinal"
            formatLabel={(_, index) => barData[index]?.label || ''}
            contentInset={{ left: 60, right: 10 }}
            svg={{ fontSize: 10, fill: lightTheme.colors.textSecondary }}
          />
        </View>
      )}

      {/* Budget Alerts */}
      <View style={styles.alertSection}>
        <Text style={styles.sectionTitle}>Budget Status</Text>
        {renderAlerts()}
      </View>

      {/* Recent Expenses */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {renderRecentExpenses()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingTop: lightTheme.spacing.lg,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: lightTheme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: lightTheme.spacing.sm,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: lightTheme.colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  chartSection: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
  },
  pieChartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.lg,
  },
  barChartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: lightTheme.spacing.md,
  },
  legendContainer: {
    gap: lightTheme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: lightTheme.colors.text,
  },
  alertSection: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.lg,
  },
  alertBox: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    marginBottom: lightTheme.spacing.sm,
  },
  alertCategory: {
    fontWeight: '700',
    color: '#856404',
    marginBottom: lightTheme.spacing.xs,
  },
  alertMessage: {
    fontSize: 12,
    color: '#856404',
  },
  noAlertsText: {
    fontSize: 14,
    color: lightTheme.colors.success,
    fontWeight: '500',
  },
  recentSection: {
    backgroundColor: lightTheme.colors.surface,
    padding: lightTheme.spacing.lg,
    borderRadius: lightTheme.borderRadius.lg,
    marginBottom: lightTheme.spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  viewAllText: {
    fontSize: 12,
    color: lightTheme.colors.primary,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: lightTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.spacing.md,
  },
  expenseCategoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseCategoryText: {
    color: lightTheme.colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  expenseDetails: {
    justifyContent: 'space-between',
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  expenseDate: {
    fontSize: 12,
    color: lightTheme.colors.textSecondary,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  noExpensesText: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: lightTheme.spacing.lg,
  },
});

export default DashboardScreen;
