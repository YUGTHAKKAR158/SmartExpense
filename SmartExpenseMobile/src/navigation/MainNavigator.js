import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Text }                      from 'react-native';
import { COLORS }                   from '../utils/constants';

// Screens
import DashboardScreen       from '../screens/dashboard/DashboardScreen';
import ExpensesScreen        from '../screens/expenses/ExpensesScreen';
import BudgetScreen          from '../screens/budget/BudgetScreen';
import GroupsScreen          from '../screens/groups/GroupsScreen';
import GroupDetailScreen     from '../screens/groups/GroupDetailScreen';
import ReportsScreen         from '../screens/reports/ReportsScreen';
import ReceiptScannerScreen  from '../screens/receipts/ReceiptScannerScreen';
import SettingsScreen        from '../screens/settings/SettingsScreen';

const Tab        = createBottomTabNavigator();
const RootStack  = createStackNavigator();
const GroupStack = createStackNavigator();

// Groups has its own stack (list → detail)
const GroupsStack = () => (
  <GroupStack.Navigator screenOptions={{ headerShown: false }}>
    <GroupStack.Screen name="GroupsList"  component={GroupsScreen} />
    <GroupStack.Screen name="GroupDetail" component={GroupDetailScreen} />
  </GroupStack.Navigator>
);

const TAB_ICONS = {
  Dashboard: '📊',
  Expenses:  '💸',
  Budget:    '🎯',
  Groups:    '👥',
  Reports:   '📄',
  Scan:      '📷',
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
          {TAB_ICONS[route.name]}
        </Text>
      ),
      tabBarLabel: ({ focused }) => (
        <Text style={{
          fontSize:   10,
          color:      focused ? COLORS.primary : COLORS.gray,
          fontWeight: focused ? '600' : '400',
          marginBottom: 4,
        }}>
          {route.name}
        </Text>
      ),
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor:  COLORS.border,
        borderTopWidth:  1,
        height:          60,
        paddingTop:      6,
      },
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Expenses"  component={ExpensesScreen} />
    <Tab.Screen name="Scan"      component={ReceiptScannerScreen} />
    <Tab.Screen name="Budget"    component={BudgetScreen} />
    <Tab.Screen name="Groups"    component={GroupsStack} />
    <Tab.Screen name="Reports"   component={ReportsScreen} />
  </Tab.Navigator>
);

// Root stack wraps tabs so Settings can be pushed over them
const MainNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="Tabs"     component={TabNavigator} />
    <RootStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        headerShown: true,
        title: 'Settings',
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '700' },
      }}
    />
  </RootStack.Navigator>
);

export default MainNavigator;