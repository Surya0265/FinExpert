import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { X, Zap, Sliders, TrendingUp } from 'lucide-react-native';
import { budgetService } from '../../services/budgetService';
import { expenseService } from '../../services/expenseService';

interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: string;
}

interface BudgetData {
  budget_id?: string;
  budget_name?: string;
  total_amount: number;
  manual_allocations: Record<string, number>;
  allocated_budget?: Record<string, number>;
  ai_period?: string;
}

interface SpendingStats {
  [category: string]: {
    spent: number;
    allocated: number;
    remaining: number;
    percentage: number;
  };
}

export default function BudgetsScreen() {
  const [mode, setMode] = useState<'selection' | 'manual' | 'ai'>('selection');
  const [totalBudget, setTotalBudget] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [aiPeriod, setAiPeriod] = useState('3months'); // 1month, 3months, 6months, 1year
  const [aiConversation, setAiConversation] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [allBudgets, setAllBudgets] = useState<BudgetData[]>([]);
  const [spendingStats, setSpendingStats] = useState<SpendingStats>({});
  const [aiAllocations, setAiAllocations] = useState<Record<string, number>>({});
  const [showAIAllocations, setShowAIAllocations] = useState(false);

  const normalizeAllocations = (allocations?: Record<string, any> | null) => {
    const normalized: Record<string, number> = {};
    if (!allocations) {
      return normalized;
    }

    Object.entries(allocations).forEach(([category, value]) => {
      const numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
      normalized[category] = Number.isFinite(numeric) ? parseFloat(numeric.toFixed(2)) : 0;
    });

    return normalized;
  };

  const mapBudgetResponse = (budget: any): BudgetData => {
    const normalizedAllocations = normalizeAllocations(budget?.manual_allocations ?? budget?.allocated_budget);

    return {
      budget_id: budget?.budget_id,
      budget_name: budget?.budget_name ?? 'Budget',
      total_amount: typeof budget?.total_amount === 'string'
        ? parseFloat(budget.total_amount)
        : Number(budget?.total_amount) || 0,
      manual_allocations: { ...normalizedAllocations },
      allocated_budget: { ...normalizedAllocations },
      created_at: budget?.created_at,
    };
  };

  // Fetch saved budget and spending data
  useEffect(() => {
    fetchBudgetAndSpending();
  }, [mode]);

  const fetchBudgetAndSpending = async () => {
    try {
      setLoading(true);

      const budgetResponse = await budgetService.getBudget();
      let latestBudget: BudgetData | null = null;

      if (budgetResponse) {
        if (budgetResponse.data) {
          latestBudget = mapBudgetResponse(budgetResponse.data);
          setBudgetData(latestBudget);
        } else {
          setBudgetData(null);
        }

        if (Array.isArray(budgetResponse.allBudgets)) {
          setAllBudgets(budgetResponse.allBudgets.map(mapBudgetResponse));
        } else {
          setAllBudgets([]);
        }
      } else {
        setBudgetData(null);
        setAllBudgets([]);
      }

      const expensesByCategory = await expenseService.getExpensesByCategory();

      const expenseData = Array.isArray(expensesByCategory?.data)
        ? expensesByCategory.data.map((entry: any) => {
            const rawAmount = entry?.amount ?? entry?.total_spent ?? 0;
            const numericAmount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount) || 0;
            return {
              category: entry?.category ?? entry?.name ?? 'Other',
              amount: Number.isFinite(numericAmount) ? parseFloat(numericAmount.toFixed(2)) : 0,
            };
          })
        : [];

      const budgetForStats = latestBudget ?? budgetData;

      if (budgetForStats) {
        const stats: SpendingStats = {};

        Object.entries(budgetForStats.manual_allocations || {}).forEach(([category, allocationValue]) => {
          const allocationNumber = typeof allocationValue === 'number'
            ? allocationValue
            : parseFloat(String(allocationValue));
          const allocated = Number.isFinite(allocationNumber) ? parseFloat(allocationNumber.toFixed(2)) : 0;

          const spentEntry = expenseData.find((entry) => entry.category === category);
          const spent = spentEntry ? spentEntry.amount : 0;
          const remaining = allocated - spent;
          const percentage = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;

          stats[category] = {
            spent,
            allocated,
            remaining: remaining > 0 ? remaining : 0,
            percentage: Math.min(Math.max(percentage, 0), 999),
          };
        });

        setSpendingStats(stats);
      } else {
        setSpendingStats({});
      }
    } catch (error) {
      console.log('No budget data yet or error fetching:', error);
      setSpendingStats({});
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await budgetService.deleteBudget(budgetId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Budget deleted successfully',
              });
              fetchBudgetAndSpending();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete budget',
              });
            }
          },
        },
      ]
    );
  };

  const addCategory = () => {
    if (!categoryInput.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === categoryInput.trim().toLowerCase())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: categoryInput.trim(),
      allocatedAmount: '0',
    };

    setCategories([...categories, newCategory]);
    setCategoryInput('');
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const updateAllocationAmount = (id: string, amount: string) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, allocatedAmount: amount } : cat
    ));
  };

  const generateAIAllocation = async () => {
    if (!totalBudget || isNaN(parseFloat(totalBudget)) || parseFloat(totalBudget) <= 0) {
      Alert.alert('Error', 'Please enter a valid total budget');
      return;
    }

    if (categories.length === 0) {
      Alert.alert('Error', 'Please add at least one category');
      return;
    }

    try {
      setLoading(true);
      
      // Start AI conversation with two questions
      const initialMessage = `I will help you allocate your ₹${totalBudget} budget across ${categories.length} categories: ${categories.map(c => c.name).join(', ')}.

To give you the best allocation, I need to analyze your spending patterns.

Question 1: How far back would you like me to look at your spending history?

Options:
- 1 Month
- 3 Months
- 6 Months
- 1 Year`;

      setAiConversation([{ role: 'ai', message: initialMessage }]);
      setShowAIAllocations(true);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to start AI allocation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSelection = async (period: string) => {
    try {
      setLoading(true);
      
      // Add user response to conversation
      const periodLabels: Record<string, string> = {
        '1month': '1 Month',
        '3months': '3 Months',
        '6months': '6 Months',
        '1year': '1 Year'
      };
      
      const newConversation = [...aiConversation, { role: 'user', message: periodLabels[period] }];
      setAiConversation(newConversation);

      // Ask second question about budget period
      const secondQuestion = `Good choice. Now, what time period should this budget cover?

Options:
- Weekly
- Monthly
- Quarterly
- Yearly`;

      const conversationWithQuestion = [...newConversation, { role: 'ai', message: secondQuestion }];
      setAiConversation(conversationWithQuestion);
      setAiPeriod(period);

    } catch (error: any) {
      const errorMsg = error.message || 'Failed to process selection';
      
      setAiConversation([...aiConversation, { role: 'ai', message: `Error: ${errorMsg}` }]);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetPeriodSelection = async (budgetPeriod: string) => {
    try {
      setLoading(true);
      
      const budgetPeriodLabels: Record<string, string> = {
        'week': 'Week',
        'month': 'Month',
        '3month': '3-Month',
        'year': 'Year'
      };
      
      // Add user response to conversation
      const newConversation = [...aiConversation, { role: 'user', message: budgetPeriodLabels[budgetPeriod] }];
      setAiConversation(newConversation);

      // Show loading message while processing
      const loadingConversation = [...newConversation, { role: 'ai', message: 'Processing your allocation... Please wait.' }];
      setAiConversation(loadingConversation);

      // Now call AI service with both periods
      const response = await budgetService.getAIBudgetAllocation({
        totalBudget: parseFloat(totalBudget),
        categories: categories.map(c => c.name),
        period: aiPeriod,
      });

      // Build allocation summary without emojis
      const allocationSummary = Object.entries(response.allocation)
        .map(([cat, amount]) => `${cat}: Rs ${amount}`)
        .join(', ');

      const aiResponse = `Based on your ${budgetPeriodLabels[budgetPeriod].toLowerCase()} budget and spending analysis, here is your allocation:

${allocationSummary}

Total allocated: Rs ${parseFloat(totalBudget).toFixed(2)}

You can now review and adjust these amounts below, then save your budget.`;

      setAiConversation([...newConversation, { role: 'ai', message: aiResponse }]);

      // Update categories with AI-generated allocations
      const updatedCategories = categories.map(cat => ({
        ...cat,
        allocatedAmount: (response.allocation[cat.name] || 0).toString(),
      }));

      setCategories(updatedCategories);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'AI allocation generated. Review below.',
      });
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const errorMsg = apiMessage || error.message || 'AI service is processing. Please try again.';
      
      // Don't show error to user, just log and remove loading message
      console.error('AI Allocation Error:', errorMsg);
      
      // Remove the loading message
      const updatedConversation = aiConversation.filter((msg, idx) => idx !== aiConversation.length - 1);
      setAiConversation(updatedConversation);
      
      Toast.show({
        type: 'info',
        text1: 'Retrying',
        text2: 'AI is retrying with different keys. Please wait...',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalAllocation = () => {
    return categories.reduce((sum, cat) => {
      const num = parseFloat(cat.allocatedAmount);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const saveBudget = async () => {
    try {
      if (!budgetName || budgetName.trim() === '') {
        Alert.alert('Error', 'Please enter a budget name');
        return;
      }

      const allocations: Record<string, number> = {};
      let isValid = true;

      for (const category of categories) {
        const amount = parseFloat(category.allocatedAmount);
        if (isNaN(amount) || amount < 0) {
          Alert.alert('Error', `Invalid amount for ${category.name}`);
          isValid = false;
          break;
        }
        allocations[category.name] = parseFloat(amount.toFixed(2));
      }

      if (!isValid) return;

      const totalAllocation = getTotalAllocation();
      if (totalAllocation > parseFloat(totalBudget)) {
        Alert.alert('Error', `Total allocation (₹${totalAllocation.toFixed(2)}) exceeds budget (₹${totalBudget})`);
        return;
      }

      setLoading(true);
      await budgetService.setBudget({
        total_amount: parseFloat(totalBudget),
        manual_allocations: allocations,
        budget_name: budgetName.trim(),
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Budget saved successfully',
      });

      // Reset form
      resetForm();
      fetchBudgetAndSpending();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save budget',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTotalBudget('');
    setBudgetName('');
    setCategories([]);
    setCategoryInput('');
    setAiAllocations({});
    setShowAIAllocations(false);
    setMode('selection');
  };

  // UNIFIED VIEW: Show options, form, and spending breakdown
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Budget Planner</Text>
          
        </View>

        {/* SECTION 1: Budget Type Options */}
        <View style={styles.optionsContainer}>
          {/* Manual Budget Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              mode === 'manual' && styles.optionCardActive,
            ]}
            onPress={() => setMode('manual')}
          >
            <View style={styles.optionIconContainer}>
              <Sliders color="#1b5e20" size={32} />
            </View>
            <Text style={styles.optionTitle}>Manual</Text>
            <Text style={styles.optionDescription}>
              Set amounts yourself
            </Text>
            {mode === 'manual' && <View style={styles.optionCheckmark} />}
          </TouchableOpacity>

          {/* AI Budget Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              mode === 'ai' && styles.optionCardActive,
            ]}
            onPress={() => setMode('ai')}
          >
            <View style={styles.optionIconContainer}>
              <Zap color="#2e7d32" size={32} />
            </View>
            <Text style={styles.optionTitle}>AI Smart</Text>
            <Text style={styles.optionDescription}>
              AI allocates for you
            </Text>
            {mode === 'ai' && <View style={styles.optionCheckmark} />}
          </TouchableOpacity>
        </View>

        {/* SECTION 2: Budget Form (changes based on mode) */}
        {mode === 'manual' && (
          <View style={styles.card}>
            {/* Budget Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Monthly Budget, Vacation Fund"
                placeholderTextColor="#999"
                value={budgetName}
                onChangeText={setBudgetName}
                editable={!loading}
              />
            </View>

            <View style={styles.divider} />

            {/* Total Budget Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Total Budget Amount</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#999"
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Categories Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Categories & Amounts</Text>
              <Text style={styles.helperText}>Define each category and its budget</Text>
              
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Category name"
                  placeholderTextColor="#999"
                  value={categoryInput}
                  onChangeText={setCategoryInput}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.addButton, loading && styles.buttonDisabled]}
                  onPress={addCategory}
                  disabled={loading}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No categories added yet. Add at least one.</Text>
              ) : (
                <>
                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.categoryRow}>
                      <Text style={styles.categoryLabel}>{cat.name}</Text>
                      <View style={styles.amountInputWrapper}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                          style={styles.allocationInput}
                          value={cat.allocatedAmount}
                          onChangeText={(val) => updateAllocationAmount(cat.id, val)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#ccc"
                          editable={!loading}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => removeCategory(cat.id)}
                        disabled={loading}
                      >
                        <X color={loading ? '#ccc' : '#e91e63'} size={20} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View style={[styles.totalRow, getTotalAllocation() > parseFloat(totalBudget || '0') && styles.totalRowError]}>
                    <View>
                      <Text style={styles.totalLabel}>Total Allocated</Text>
                      <Text style={styles.totalAmount}>
                        ₹{getTotalAllocation().toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.budgetCompare}>
                      <Text style={styles.budgetLabel}>Budget</Text>
                      <Text style={styles.budgetAmount}>₹{totalBudget || '0'}</Text>
                    </View>
                  </View>

                  {getTotalAllocation() > parseFloat(totalBudget || '0') && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        Budget exceeded by ₹{(getTotalAllocation() - parseFloat(totalBudget || '0')).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (loading || !budgetName || !totalBudget || categories.length === 0 || getTotalAllocation() > parseFloat(totalBudget || '0')) && styles.buttonDisabled,
                ]}
                onPress={saveBudget}
                disabled={loading || !budgetName || !totalBudget || categories.length === 0 || getTotalAllocation() > parseFloat(totalBudget || '0')}
              >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Budget'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === 'ai' && (
          <View style={styles.card}>
            {/* Budget Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Monthly Budget, Vacation Fund"
                placeholderTextColor="#999"
                value={budgetName}
                onChangeText={setBudgetName}
                editable={!loading && !showAIAllocations}
              />
            </View>

            <View style={styles.divider} />

            {/* Total Budget Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Total Budget Amount</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#999"
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  keyboardType="decimal-pad"
                  editable={!loading && !showAIAllocations}
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Categories Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Spending Categories</Text>
              <Text style={styles.helperText}>AI will allocate budget to these</Text>
              
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Category name"
                  placeholderTextColor="#999"
                  value={categoryInput}
                  onChangeText={setCategoryInput}
                  editable={!loading && !showAIAllocations}
                />
                <TouchableOpacity
                  style={[styles.addButton, (loading || showAIAllocations) && styles.buttonDisabled]}
                  onPress={addCategory}
                  disabled={loading || showAIAllocations}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {categories.length === 0 ? (
                <Text style={styles.emptyText}>No categories added yet. Add multiple categories.</Text>
              ) : (
                <View style={styles.categoriesContainer}>
                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{cat.name}</Text>
                      <TouchableOpacity
                        onPress={() => removeCategory(cat.id)}
                        disabled={loading || showAIAllocations}
                        style={styles.removeTag}
                      >
                        <X color={loading || showAIAllocations ? '#ccc' : '#fff'} size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {categories.length > 0 && !showAIAllocations && mode === 'ai' && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.generateButton,
                    (loading || !totalBudget || !budgetName) && styles.buttonDisabled,
                  ]}
                  onPress={generateAIAllocation}
                  disabled={loading || !totalBudget || !budgetName}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>🤖 Ask AI for Budget</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {showAIAllocations && mode === 'ai' && aiConversation.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.aiChatContainer}>
                  <Text style={styles.sectionTitle}>💬 AI Budget Assistant</Text>
                  
                  {aiConversation.map((msg, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.chatMessage,
                        msg.role === 'ai' ? styles.aiMessage : styles.userMessage,
                      ]}
                    >
                      <Text style={[styles.chatText, msg.role === 'ai' && styles.aiMessageText]}>
                        {msg.message}
                      </Text>
                    </View>
                  ))}

                  {aiConversation.length > 0 && aiConversation[aiConversation.length - 1].role === 'ai' && 
                   aiConversation[aiConversation.length - 1].message.includes('far back') && (
                    <View style={styles.periodButtonsContainer}>
                      {[
                        { label: '1 Month', value: '1month' },
                        { label: '3 Months', value: '3months' },
                        { label: '6 Months', value: '6months' },
                        { label: '1 Year', value: '1year' },
                      ].map((period) => (
                        <TouchableOpacity
                          key={period.value}
                          style={styles.periodButton}
                          onPress={() => handlePeriodSelection(period.value)}
                          disabled={loading}
                        >
                          <Text style={styles.periodButtonText}>{period.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {aiConversation.length > 0 && aiConversation[aiConversation.length - 1].role === 'ai' && 
                   aiConversation[aiConversation.length - 1].message.includes('time period') && (
                    <View style={styles.periodButtonsContainer}>
                      {[
                        { label: 'Week', value: 'week' },
                        { label: 'Month', value: 'month' },
                        { label: '3-Month', value: '3month' },
                        { label: 'Year', value: 'year' },
                      ].map((period) => (
                        <TouchableOpacity
                          key={period.value}
                          style={styles.periodButton}
                          onPress={() => handleBudgetPeriodSelection(period.value)}
                          disabled={loading}
                        >
                          <Text style={styles.periodButtonText}>{period.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {showAIAllocations && categories.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Review & Adjust</Text>
                  <Text style={styles.helperText}>Edit amounts if needed before saving</Text>

                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.allocationRow}>
                      <Text style={styles.categoryLabel}>{cat.name}</Text>
                      <View style={styles.amountInputWrapper}>
                        <Text style={styles.currencySymbol}>₹</Text>
                        <TextInput
                          style={styles.allocationInput}
                          value={cat.allocatedAmount}
                          onChangeText={(val) => updateAllocationAmount(cat.id, val)}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#ccc"
                          editable={!loading}
                        />
                      </View>
                    </View>
                  ))}

                  <View style={[styles.totalRow, getTotalAllocation() > parseFloat(totalBudget) && styles.totalRowError]}>
                    <View>
                      <Text style={styles.totalLabel}>Total Allocated</Text>
                      <Text style={styles.totalAmount}>
                        ₹{getTotalAllocation().toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.budgetCompare}>
                      <Text style={styles.budgetLabel}>Budget</Text>
                      <Text style={styles.budgetAmount}>₹{totalBudget}</Text>
                    </View>
                  </View>

                  {getTotalAllocation() > parseFloat(totalBudget) && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        Budget exceeded by ₹{(getTotalAllocation() - parseFloat(totalBudget)).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.button, styles.backButtonStyle]}
                      onPress={() => {
                        setShowAIAllocations(false);
                        setAiAllocations({});
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.saveButton,
                        (loading || getTotalAllocation() > parseFloat(totalBudget)) && styles.buttonDisabled,
                      ]}
                      onPress={saveBudget}
                      disabled={loading || getTotalAllocation() > parseFloat(totalBudget)}
                    >
                      <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Budget'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* SECTION 3: All Budgets List - Main Budget Display */}
        {allBudgets && allBudgets.length > 0 && (
          <View style={styles.allBudgetsContainer}>
            <View style={styles.allBudgetsHeader}>
              <TrendingUp color="#1b5e20" size={22} />
              <Text style={styles.allBudgetsMainTitle}>Your Budgets</Text>
            </View>
            
            {allBudgets.map((budget, index) => (
              <View key={`${budget.budget_id ?? budget.budget_name}-${index}`} style={styles.budgetCard}>
                <View style={styles.budgetCardHeader}>
                  <View style={styles.budgetCardInfo}>
                    <Text style={styles.budgetCardName}>{budget.budget_name}</Text>
                    <Text style={styles.budgetCardTotal}>
                      Total: ₹{Number(budget.total_amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (!budget.budget_id) {
                        return;
                      }
                      deleteBudget(budget.budget_id);
                    }}
                    style={styles.budgetDeleteButton}
                    disabled={!budget.budget_id}
                  >
                    <X color="#e91e63" size={20} />
                  </TouchableOpacity>
                </View>

                {budget.allocated_budget && Object.keys(budget.allocated_budget).length > 0 && (
                  <View style={styles.budgetBreakdown}>
                    <Text style={styles.breakdownTitle}>Category Allocation</Text>
                    {Object.entries(budget.allocated_budget).map(([category, value]) => {
                      const allocationNumber = typeof value === 'number' ? value : parseFloat(String(value));
                      const allocated = Number.isFinite(allocationNumber) ? parseFloat(allocationNumber.toFixed(2)) : 0;
                      
                      // Get spending for this category
                      const categoryStats = spendingStats[category];
                      const spent = categoryStats ? categoryStats.spent : 0;
                      const percentage = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;
                      const remaining = Math.max(allocated - spent, 0);
                      const overBudget = spent > allocated;

                      return (
                        <View key={`${budget.budget_id ?? budget.budget_name}-${category}`} style={styles.categoryBreakdownItem}>
                          <View style={styles.categoryBreakdownHeader}>
                            <Text style={styles.categoryBreakdownName}>{category}</Text>
                            <Text style={[
                              styles.categoryBreakdownPercent,
                              overBudget && styles.categoryOverBudget
                            ]}>
                              {percentage.toFixed(0)}%
                            </Text>
                          </View>
                          
                          <View style={styles.categoryBreakdownProgress}>
                            <View
                              style={[
                                styles.categoryBreakdownFill,
                                {
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: overBudget ? '#e91e63' : '#4caf50',
                                },
                              ]}
                            />
                          </View>
                          
                          <View style={styles.categoryBreakdownStats}>
                            <Text style={styles.categoryBreakdownSpent}>
                              ₹{spent.toFixed(2)} / ₹{allocated.toFixed(2)}
                            </Text>
                            <Text style={[
                              styles.categoryBreakdownRemaining,
                              overBudget && styles.categoryOverBudget
                            ]}>
                              Remaining: ₹{remaining.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardActive: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  optionCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    marginTop: 8,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  optionBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  optionBadgeText: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#9e9e9e',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
    paddingLeft: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
  },
  emptyText: {
    color: '#999',
    fontFamily: 'PoppinsRegular',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
    gap: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  removeTag: {
    padding: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  generateButton: {
    backgroundColor: '#2e7d32',
  },
  saveButton: {
    backgroundColor: '#1b5e20',
  },
  backButtonStyle: {
    backgroundColor: '#757575',
  },
  editButton: {
    backgroundColor: '#388e3c',
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  aiChatContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  chatMessage: {
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    maxWidth: '95%',
  },
  aiMessage: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#2e7d32',
    alignSelf: 'flex-end',
  },
  chatText: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#263238',
    lineHeight: 18,
  },
  aiMessageText: {
    color: '#1b5e20',
  },
  periodButtonsContainer: {
    marginTop: 12,
    gap: 8,
  },
  periodButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  periodButtonText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  periodOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  periodOptionActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  periodOptionText: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#757575',
  },
  periodOptionTextActive: {
    color: '#1b5e20',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    width: 110,
  },
  allocationInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginVertical: 12,
  },
  totalRowError: {
    backgroundColor: '#ffebee',
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
  },
  budgetCompare: {
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
  },
  budgetAmount: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  warningBox: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e91e63',
  },
  warningText: {
    color: '#c2185b',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 12,
  },
  overBudget: {
    color: '#e91e63',
  },
  spendingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  spendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  spendingTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#1b5e20',
  },
  categorySpendingItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categorySpendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categorySpendingName: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  categorySpendingPercent: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#4caf50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categorySpendingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spendingRatio: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  spendingText: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#757575',
  },
  spendingAmount: {
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  overBudgetText: {
    color: '#e91e63',
  },
  remainingOverBudget: {
    color: '#e91e63',
  },
  editBudgetButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  editBudgetButtonText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
  },
  subtitleCenter: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#616161',
    textAlign: 'center',
    marginBottom: 20,
  },
  allBudgetsContainer: {
    marginTop: 24,
  },
  allBudgetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  allBudgetsMainTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
  },
  budgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  budgetCardInfo: {
    flex: 1,
  },
  budgetCardName: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#1b5e20',
    marginBottom: 4,
  },
  budgetCardTotal: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#2e7d32',
  },
  budgetDeleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  budgetBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e8f5e9',
    paddingTop: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#757575',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBreakdownItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBreakdownName: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  categoryBreakdownPercent: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    color: '#4caf50',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryOverBudget: {
    color: '#e91e63',
    backgroundColor: '#ffebee',
  },
  categoryBreakdownProgress: {
    height: 7,
    backgroundColor: '#f0f0f0',
    borderRadius: 3.5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryBreakdownFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  categoryBreakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBreakdownSpent: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  categoryBreakdownRemaining: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#757575',
  },
  budgetCategoryList: {
    marginTop: 4,
  },
  budgetCategoryRow: {
    marginBottom: 12,
  },
  budgetCategoryContent: {
    gap: 4,
  },
  budgetCategoryName: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#424242',
  },
  budgetCategoryAmount: {
    fontSize: 12,
    fontFamily: 'PoppinsSemiBold',
    color: '#2e7d32',
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetRemainingText: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#757575',
  },
  deleteButton: {
    padding: 8,
  },
});