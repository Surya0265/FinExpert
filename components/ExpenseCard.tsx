import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag, Car, Home, Coffee, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Expense } from '@/services/expenseService';

interface ExpenseCardProps {
  expense: Expense;
}

const getCategoryIcon = (category: string) => {
  const iconProps = { size: 20, color: Colors.primary };
  
  switch (category.toLowerCase()) {
    case 'food':
    case 'restaurant':
    case 'groceries':
      return <Coffee {...iconProps} />;
    case 'transport':
    case 'fuel':
    case 'car':
      return <Car {...iconProps} />;
    case 'shopping':
    case 'clothes':
      return <ShoppingBag {...iconProps} />;
    case 'home':
    case 'rent':
    case 'utilities':
      return <Home {...iconProps} />;
    default:
      return <MoreHorizontal {...iconProps} />;
  }
};

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getCategoryIcon(expense.category)}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.category}>{expense.category}</Text>
        <Text style={styles.date}>{formatDate(expense.date)}</Text>
      </View>
      
      <Text style={styles.amount}>-${parseFloat(expense.amount.toString()).toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  category: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.error,
  },
});