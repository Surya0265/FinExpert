import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={theme.colors.gradient}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animatable.View
          animation="bounceIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <View style={styles.iconBackground}>
            <Ionicons
              name="wallet"
              size={60}
              color={theme.colors.textLight}
            />
          </View>
        </Animatable.View>

        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          duration={1000}
          style={styles.title}
        >
          FinExpert
        </Animatable.Text>

        <Animatable.Text
          animation="fadeInUp"
          delay={800}
          duration={1000}
          style={styles.subtitle}
        >
          Your Personal Finance Manager
        </Animatable.Text>

        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          delay={1200}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, { marginLeft: 8 }]} />
          <View style={[styles.loadingDot, { marginLeft: 8 }]} />
        </Animatable.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: theme.fontSize.xxl + 8,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textLight,
    opacity: 0.7,
  },
});

export default SplashScreen;