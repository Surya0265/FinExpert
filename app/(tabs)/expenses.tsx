import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Plus, X, CreditCard as Edit3, Trash2, UtensilsCrossed, Car, ShoppingBag, Gamepad2, Receipt, Heart, GraduationCap, Plane, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { expensesAPI } from '@/services/api';
import { theme } from '@/constants/theme';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
];

interface Expense {
  expense_id: string;
  amount: string;
  category: string;
  date: string;
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await expensesAPI.getExpenses();
      setExpenses(response.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load expenses',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleAddExpense = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingExpense) {
        await expensesAPI.updateExpense(editingExpense.expense_id, {
          amount: parseFloat(amount),
          category,
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Expense updated successfully',
        });
      } else {
        await expensesAPI.addExpense({
          amount: parseFloat(amount),
          category,
        });
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Expense added successfully',
        });
      }
      
      setModalVisible(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save expense',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setModalVisible(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expensesAPI.deleteExpense(expense.expense_id);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Expense deleted successfully',
              });
              loadExpenses();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete expense',
              });
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setAmount('');
    setCategory('Food & Dining');
    setEditingExpense(null);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Food & Dining': UtensilsCrossed,
      'Transportation': Car,
      'Shopping': ShoppingBag,
      'Entertainment': Gamepad2,
      'Bills & Utilities': Receipt,
      'Healthcare': Heart,
      'Education': GraduationCap,
      'Travel': Plane,
      'Other': MoreHorizontal,
    };
    return icons[category] || MoreHorizontal;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food & Dining': theme.colors.primary,
      'Transportation': theme.colors.info,
      'Shopping': theme.colors.secondary,
      'Entertainment': theme.colors.accent,
      'Bills & Utilities': theme.colors.warning,
      'Healthcare': theme.colors.error,
      'Education': '#9C27B0',
      'Travel': '#00BCD4',
      'Other': theme.colors.textSecondary,
    };
    return colors[category] || theme.colors.textSecondary;
  };

  const ExpenseItem = ({ item, index }: { item: Expense; index: number }) => {
    const IconComponent = getCategoryIcon(item.category);
    
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        style={styles.expenseItem}
      >
        <View style={styles.expenseContent}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) }]}>
            <IconComponent size={20} color={theme.colors.textLight} />
          </View>
          
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseCategory}>{item.category}</Text>
            <Text style={styles.expenseDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.expenseAmount}>
            <Text style={styles.amountText}>${parseFloat(item.amount).toFixed(2)}</Text>
          </View>
          
          <View style={styles.expenseActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditExpense(item)}
            >
              <Edit3 size={16} color={theme.colors.info} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteExpense(item)}
            >
              <Trash2 size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.colors.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Expenses</Text>
          <Text style={styles.headerSubtitle}>Track your spending</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <LinearGradient colors={theme.colors.gradient} style={styles.addButtonGradient}>
            <Plus size={24} color={theme.colors.textLight} />
            <Text style={styles.addButtonText}>Add Expense</Text>
          </LinearGradient>
        </TouchableOpacity>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.expense_id}
          renderItem={({ item, index }) => <ExpenseItem item={item} index={index} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.expensesList}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const IconComponent = getCategoryIcon(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <IconComponent
                        size={16}
                        color={category === cat ? theme.colors.textLight : getCategoryColor(cat)}
                        style={styles.categoryChipIcon}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleAddExpense}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
}

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
    fontFamily: 'Poppins-Bold',
    color: theme.colors.textLight,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  addButton: {
    marginBottom: theme.spacing.lg,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-SemiBold',
    marginLeft: theme.spacing.sm,
  },
  expensesList: {
    paddingBottom: theme.spacing.lg,
  },
  expenseItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  expenseDate: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  expenseAmount: {
    marginRight: theme.spacing.md,
  },
  amountText: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
  expenseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
  },
  formContainer: {
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryScroll: {
    marginBottom: theme.spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipIcon: {
    marginRight: theme.spacing.xs,
  },
  categoryChipText: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text,
  },
  categoryChipTextSelected: {
    color: theme.colors.textLight,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-SemiBold',
  },
});