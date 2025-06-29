import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Download, Mail, FileText, Calendar, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { reportsAPI } from '@/services/api';
import { theme } from '@/constants/theme';

export default function ReportsScreen() {
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const handleDownloadReport = async (reportDays: number) => {
    try {
      setLoading(true);
      await reportsAPI.downloadReport(reportDays);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Report downloaded successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download report',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter an email address',
      });
      return;
    }

    if (!days || isNaN(parseInt(days))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Days',
        text2: 'Please enter a valid number of days',
      });
      return;
    }

    try {
      setLoading(true);
      await reportsAPI.sendReportByEmail({
        email,
        days: parseInt(days),
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Report sent to email successfully',
      });
      
      setEmailModalVisible(false);
      setEmail('');
      setDays('30');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send report',
      });
    } finally {
      setLoading(false);
    }
  };

  const ReportCard = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    color, 
    onPress 
  }: {
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    onPress: () => void;
  }) => (
    <Animatable.View animation="fadeInUp" duration={600}>
      <TouchableOpacity style={styles.reportCard} onPress={onPress}>
        <LinearGradient colors={[color, `${color}CC`]} style={styles.reportCardGradient}>
          <View style={styles.reportCardContent}>
            <View style={styles.reportCardIcon}>
              <Icon size={32} color={theme.colors.textLight} />
            </View>
            <View style={styles.reportCardText}>
              <Text style={styles.reportCardTitle}>{title}</Text>
              <Text style={styles.reportCardSubtitle}>{subtitle}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const QuickReportCard = ({ 
    period, 
    days: reportDays 
  }: {
    period: string;
    days: number;
  }) => (
    <Animatable.View animation="fadeInUp" duration={600}>
      <TouchableOpacity 
        style={styles.quickReportCard}
        onPress={() => handleDownloadReport(reportDays)}
      >
        <View style={styles.quickReportContent}>
          <Calendar size={24} color={theme.colors.primary} />
          <Text style={styles.quickReportText}>{period}</Text>
          <Download size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.colors.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>Generate financial reports</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.actionsContainer}>
          <ReportCard
            title="Download Report"
            subtitle="Get PDF report of your expenses"
            icon={Download}
            color={theme.colors.primary}
            onPress={() => handleDownloadReport(30)}
          />
          
          <ReportCard
            title="Email Report"
            subtitle="Send report to your email"
            icon={Mail}
            color={theme.colors.secondary}
            onPress={() => setEmailModalVisible(true)}
          />
        </View>

        <View style={styles.quickReportsSection}>
          <Text style={styles.sectionTitle}>Quick Reports</Text>
          <QuickReportCard period="Last 7 Days" days={7} />
          <QuickReportCard period="Last 30 Days" days={30} />
          <QuickReportCard period="Last 90 Days" days={90} />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoCard}>
            <FileText size={24} color={theme.colors.info} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What's Included</Text>
              <Text style={styles.infoText}>
                • Detailed expense breakdown by category{'\n'}
                • Daily spending summary{'\n'}
                • Total expenses for the period{'\n'}
                • Professional PDF format
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Email Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Report by Email</Text>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Number of Days</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter number of days"
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                onPress={handleSendEmail}
                disabled={loading}
              >
                <Text style={styles.sendButtonText}>
                  {loading ? 'Sending...' : 'Send Report'}
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
  actionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  reportCard: {
    marginBottom: theme.spacing.md,
  },
  reportCardGradient: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  reportCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportCardIcon: {
    marginRight: theme.spacing.md,
  },
  reportCardText: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.textLight,
  },
  reportCardSubtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
    opacity: 0.8,
    marginTop: theme.spacing.xs,
  },
  quickReportsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickReportCard: {
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
  quickReportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickReportText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  infoSection: {
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
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
    maxHeight: '70%',
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
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: theme.colors.textLight,
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-SemiBold',
  },
});