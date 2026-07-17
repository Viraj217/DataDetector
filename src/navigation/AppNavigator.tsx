import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DayDetailScreen } from '../screens/DayDetailScreen';
import { AppsListScreen } from '../screens/AppsListScreen';
import { AppDetailScreen } from '../screens/AppDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

import {
  TodayStackParamList,
  HistoryStackParamList,
  AppsStackParamList,
  SettingsStackParamList,
} from './types';

const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const AppsStack = createNativeStackNavigator<AppsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const Tab = createBottomTabNavigator();

// Custom SVG Icons for Tab Bar
const TabIcon: React.FC<{ name: string; color: string; size: number }> = ({ name, color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'today' && (
        <>
          <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
          <Path d="M3 9H21" stroke={color} strokeWidth="2" />
          <Path d="M9 21V9" stroke={color} strokeWidth="2" />
        </>
      )}
      {name === 'history' && (
        <>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <Path d="M12 7V12L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {name === 'apps' && (
        <>
          <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
          <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
          <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
          <Rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
          <Path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
};

// Stack Navigators
const TodayStackNavigator = () => {
  const { colors } = useTheme();
  return (
    <TodayStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <TodayStack.Screen
        name="TodayHome"
        component={HomeScreen}
        options={{ title: 'Today' }}
      />
      <TodayStack.Screen
        name="AppDetail"
        component={AppDetailScreen}
        options={{ title: 'App Usage Trend' }}
      />
    </TodayStack.Navigator>
  );
};

const HistoryStackNavigator = () => {
  const { colors } = useTheme();
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <HistoryStack.Screen
        name="HistoryHome"
        component={HistoryScreen}
        options={{ title: 'Usage History' }}
      />
      <HistoryStack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ title: 'Day Breakdown' }}
      />
      <HistoryStack.Screen
        name="AppDetail"
        component={AppDetailScreen}
        options={{ title: 'App Usage Trend' }}
      />
    </HistoryStack.Navigator>
  );
};

const AppsStackNavigator = () => {
  const { colors } = useTheme();
  return (
    <AppsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <AppsStack.Screen
        name="AppsHome"
        component={AppsListScreen}
        options={{ title: 'All Apps' }}
      />
      <AppsStack.Screen
        name="AppDetail"
        component={AppDetailScreen}
        options={{ title: 'App Usage Trend' }}
      />
    </AppsStack.Navigator>
  );
};

const SettingsStackNavigator = () => {
  const { colors } = useTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            elevation: 4,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen
          name="TodayTab"
          component={TodayStackNavigator}
          options={{
            tabBarLabel: 'Today',
            tabBarIcon: ({ color, size }) => <TabIcon name="today" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="HistoryTab"
          component={HistoryStackNavigator}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ color, size }) => <TabIcon name="history" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="AppsTab"
          component={AppsStackNavigator}
          options={{
            tabBarLabel: 'Apps',
            tabBarIcon: ({ color, size }) => <TabIcon name="apps" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
