import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export default function StatCard({ title, value, icon, trend, trendValue }: StatCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {icon}
        {trend && trendValue && (
          <View style={[styles.trendContainer, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            {trend === 'up' ? (
              <TrendingUp size={12} color={trend === 'up' ? Colors.success : Colors.error} />
            ) : (
              <TrendingDown size={12} color={trend === 'up' ? Colors.success : Colors.error} />
            )}
            <Text style={[styles.trendText, { color: trend === 'up' ? Colors.success : Colors.error }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendUp: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  trendDown: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  trendText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginLeft: 2,
  },
  value: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.textSecondary,
  },
});