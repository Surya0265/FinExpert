import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { expenseService, Expense, AddExpenseData } from '../../services/expenseService';
import Toast from 'react-native-toast-message';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AddExpenseData>({ amount: 0, category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load expenses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ amount: 0, category: '' });
    setModalVisible(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.expense_id);
    setForm({ amount: expense.amount, category: expense.category });
    setModalVisible(true);
  };

  const saveExpense = async () => {
    if (!form.amount || !form.category) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    try {
      if (editingId) {
        await expenseService.updateExpense(editingId, form);
        Toast.show({ type: 'success', text1: 'Expense updated' });
      } else {
        await expenseService.addExpense(form);
        Toast.show({ type: 'success', text1: 'Expense added' });
      }
      setModalVisible(false);
      loadExpenses();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Could not save expense' });
    }
  };

  const deleteExpense = async (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(id);
              Toast.show({ type: 'success', text1: 'Expense deleted' });
              loadExpenses();
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Could not delete expense' });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      <FlatList
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LinearGradient
            colors={['#4830D3', '#7C4DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <SafeAreaView edges={['top']} style={styles.safeHeader}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerTitle}>Expenses</Text>
                  <Text style={styles.headerSubtitle}>Track your daily spending</Text>
                </View>
                <View style={styles.iconContainer}>
                  <Receipt size={24} color="#ffffff" />
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        }
        ListHeaderComponentStyle={styles.listHeaderSpacing}
        data={expenses}
        keyExtractor={(item) => item.expense_id.toString()}
        onRefresh={loadExpenses}
        refreshing={loading}
        renderItem={({ item }) => {
          const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount) || 0;
          const dateLabel = item.date ? new Date(item.date).toDateString() : 'No date';

          return (
            <View style={styles.itemWrapper}>
              <TouchableOpacity style={styles.item} onPress={() => openEdit(item)}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
                  <Text style={styles.itemDate}>{dateLabel}</Text>
                </View>
                <Text style={styles.itemAmount}>₹{amount.toFixed(2)}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteExpense(item.expense_id)}
              >
                <Trash2 size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No expenses yet.</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Text style={styles.fabText}>+ Add expense</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit expense' : 'New expense'}</Text>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.amount ? String(form.amount) : ''}
              onChangeText={(v) => setForm((f) => ({ ...f, amount: Number(v) || 0 }))}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Groceries, Rent..."
              value={form.category}
              onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveExpense}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  listHeaderSpacing: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 150,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    marginHorizontal: 16,
  },
  item: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#5B4DBC',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0EEFA',
  },
  itemLeft: {
    flex: 1,
  },
  itemCategory: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#263238',
  },
  itemDate: {
    fontFamily: 'PoppinsRegular',
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#5B4DBC',
  },
  deleteButton: {
    backgroundColor: '#FF9F43',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d32f2f',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 11,
    color: '#d32f2f',
    marginTop: 2,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#9e9e9e',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 18,
    color: '#263238',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#616161',
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#212121',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    color: '#757575',
  },
  saveButton: {
    backgroundColor: '#5B4DBC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#5B4DBC',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 15,
  },
});


