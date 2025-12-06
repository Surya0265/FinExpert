import { Tabs } from 'expo-router';
import { Wallet, PieChart, Target, FileDown, Sparkles } from 'lucide-react-native';
import { View, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B4DBC',
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 8,
          height: 102,
          paddingBottom: Platform.OS === 'ios' ? 75 : 67,
          paddingTop: 8,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'PoppinsSemiBold',
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


