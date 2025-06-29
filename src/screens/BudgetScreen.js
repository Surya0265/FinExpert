import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { budgetAPI } from '../services/api';
import { theme } from '../theme/theme';

const BudgetScreen = () => {
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [adviceModalVisible, setAdviceModalVisible] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [budgetAlerts, setBudgetAlerts] = useState({});
  const [aiAdvice, setAiAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudgetAlerts();
  }, []);

  const loadBudgetAlerts = async () => {
    try {
      const response = await budgetAPI.getBudgetAlerts();
      setBudgetAlerts(response.data.alerts || {});
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    }
  };

  const handleSetBudget = async () => {
    if (!totalBudget || isNaN(parseFloat(totalBudget))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid budget amount',
      });
      return;
    }

    try {
      setLoading(true);
      await budgetAPI.setBudget({
        total_amount: parseFloat(totalBudget),
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Budget set successfully',
      });
      
      setBudgetModalVisible(false);
      setTotalBudget('');
      loadBudgetAlerts();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to set budget',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAIAdvice = async (period) => {
    try {
      setLoading(true);
      const response = await budgetAPI.getBudgetAdvice(period);
      setAiAdvice(response.data.advice);
      setAdviceModalVisible(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to get AI advice',
      });
    } finally {
      setLoading(false);
    }
  };

  const AlertCard = ({ category, message }) => (
    <Animatable.View animation="fadeInUp" duration={600} style={styles.alertCard}>
      <View style={styles.alertIcon}>
        <Ionicons name="warning" size={24} color={theme.colors.warning} />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertCategory}>{category}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
      </View>
    </Animatable.View>
  );

  const ActionCard = ({ title, subtitle, icon, color, onPress }) => (
    <Animatable.View animation="fadeInUp" duration={600}>
      <TouchableOpacity style={styles.actionCard} onPress={onPress}>
        <LinearGradient colors={[color, `${color}CC`]} style={styles.actionCardGradient}>
          <View style={styles.actionCardContent}>
            <View style={styles.actionCardIcon}>
              <Ionicons name={icon} size={32} color={theme.colors.textLight} />
            </View>
            <View style={styles.actionCardText}>
              <Text style={styles.actionCardTitle}>{title}</Text>
              <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
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
          <Text style={styles.headerTitle}>Budget</Text>
          <Text style={styles.headerSubtitle}>Manage your finances</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actionsContainer}>
          <ActionCard
            title="Set Budget"
            subtitle="Create your monthly budget"
            icon="pie-chart"
            color={theme.colors.primary}
            onPress={() => setBudgetModalVisible(true)}
          />
          
          <ActionCard
            title="Weekly Advice"
            subtitle="Get AI insights for this week"
            icon="bulb"
            color={theme.colors.secondary}
            onPress={() => getAIAdvice('week')}
          />
          
          <ActionCard
            title="Monthly Advice"
            subtitle="Get AI insights for this month"
            icon="analytics"
            color={theme.colors.info}
            onPress={() => getAIAdvice('month')}
          />
        </View>

        {Object.keys(budgetAlerts).length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Budget Alerts</Text>
            {Object.entries(budgetAlerts).map(([category, message]) => (
              <AlertCard key={category} category={category} message={message} />
            ))}
          </View>
        )}

        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Budget Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="lightbulb" size={24} color={theme.colors.secondary} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>50/30/20 Rule</Text>
              <Text style={styles.tipText}>
                Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <Ionicons name="trending-up" size={24} color={theme.colors.accent} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Track Regularly</Text>
              <Text style={styles.tipText}>
                Review your spending weekly to stay on track with your budget goals.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={budgetModalVisible}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Monthly Budget</Text>
              <TouchableOpacity onPress={() => setBudgetModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Total Monthly Budget</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter total budget amount"
                value={totalBudget}
                onChangeText={setTotalBudget}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSetBudget}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Setting Budget...' : 'Set Budget'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>

      {/* AI Advice Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={adviceModalVisible}
        onRequestClose={() => setAdviceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.adviceModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Financial Advice</Text>
              <TouchableOpacity onPress={() => setAdviceModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.adviceContainer}>
              <Text style={styles.adviceText}>{aiAdvice}</Text>
            </ScrollView>
          </Animatable.View>
        </View>
      </Modal>
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
  actionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    marginBottom: theme.spacing.md,
  },
  actionCardGradient: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardIcon: {
    marginRight: theme.spacing.md,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textLight,
  },
  actionCardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  alertsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIcon: {
    marginRight: theme.spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertCategory: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  alertMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  tipsSection: {
    marginBottom: theme.spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  tipTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  tipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxHeight: '60%',
  },
  adviceModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
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
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  formContainer: {
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontWeight: theme.fontWeight.semibold,
  },
  adviceContainer: {
    padding: theme.spacing.lg,
    maxHeight: 400,
  },
  adviceText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
  },
});

export default BudgetScreen;