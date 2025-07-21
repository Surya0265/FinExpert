import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { User, Settings, Bell, Shield, CircleHelp as HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { storage } from '@/utils/storage';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.removeItem('userToken');
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been logged out successfully',
              });
              router.replace('/auth');
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to logout',
              });
            }
          },
        },
      ]
    );
  };

  const ProfileOption = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress,
    showChevron = true 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
  }) => (
    <Animatable.View animation="fadeInUp" duration={600}>
      <TouchableOpacity style={styles.optionCard} onPress={onPress}>
        <View style={styles.optionContent}>
          <View style={styles.optionIcon}>
            <Icon size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{title}</Text>
            {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
          </View>
          {showChevron && (
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.colors.gradient} style={styles.header}>
        <View style={styles.headerContent}>
          <Animatable.View animation="bounceIn" duration={1000} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color={theme.colors.textLight} />
            </View>
          </Animatable.View>
          <Animatable.Text 
            animation="fadeInUp" 
            delay={300} 
            duration={800} 
            style={styles.userName}
          >
            John Doe
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInUp" 
            delay={500} 
            duration={800} 
            style={styles.userEmail}
          >
            john.doe@example.com
          </Animatable.Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ProfileOption
            icon={Settings}
            title="Settings"
            subtitle="App preferences and configuration"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Settings feature will be available soon',
              });
            }}
          />
          
          <ProfileOption
            icon={Bell}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Notification settings will be available soon',
              });
            }}
          />
          
          <ProfileOption
            icon={Shield}
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Privacy settings will be available soon',
              });
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <ProfileOption
            icon={HelpCircle}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Coming Soon',
                text2: 'Help center will be available soon',
              });
            }}
          />
        </View>

        <View style={styles.section}>
          <ProfileOption
            icon={LogOut}
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
          />
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>FinExpert v1.0.0</Text>
          <Text style={styles.appDescription}>
            Your personal finance management companion
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textLight,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'Inter-SemiBold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  optionIcon: {
    marginRight: theme.spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
  },
  optionSubtitle: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  appVersion: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'Inter-Medium',
    color: theme.colors.textSecondary,
  },
  appDescription: {
    fontSize: theme.fontSize.xs,
    fontFamily: 'Inter-Regular',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});