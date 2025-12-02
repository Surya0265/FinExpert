import { Tabs } from 'expo-router';
import { Wallet, PieChart, Target, FileDown, Sparkles } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 56 : 40,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#e0e0e0',
          borderTopWidth: 1,
          elevation: 0,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 14 : 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Wallet color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color, size }) => (
            <View>
              <PieChart color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Target color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'AI Advice',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Sparkles color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <View>
              <FileDown color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}


