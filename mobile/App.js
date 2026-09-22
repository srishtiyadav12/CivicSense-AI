import './global.css';
import React from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Icon from './src/components/Icon';
import { colors, typography } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import ComplaintDetailScreen from './src/screens/ComplaintDetailScreen';
import SubmitComplaintScreen from './src/screens/SubmitComplaintScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MapScreen from './src/screens/MapScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ClustersScreen from './src/screens/ClustersScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  DashboardTab: 'home',
  MapTab: 'mapPin',
  SubmitTab: 'plus',
  ComplaintsTab: 'list',
  ClustersTab: 'cluster',
  ProfileTab: 'user',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleStyle: {
          fontWeight: typography.fontWeights.bold,
          fontSize: typography.fontSizes.lg,
          color: colors.text
        },
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.medium
        },
        tabBarIcon: ({ focused, color, size }) => {
          const name = TAB_ICONS[route.name];
          return (
            <View style={{ width: size, height: size }}>
              <Icon name={name} size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Home', headerShown: false }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ title: 'Map', headerShown: false }}
      />
      <Tab.Screen
        name="SubmitTab"
        component={SubmitComplaintScreen}
        options={{ title: 'Report', headerShown: false }}
      />
      <Tab.Screen
        name="ComplaintsTab"
        component={ComplaintsScreen}
        options={{ title: 'Complaints', headerShown: false }}
      />
      <Tab.Screen
  name="ClustersTab"
  component={ClustersScreen}
  options={{ title: 'Clusters', headerShown: false }}
/>
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  const stackScreenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.primary,
    headerTitleStyle: {
      fontWeight: typography.fontWeights.bold,
      fontSize: typography.fontSizes.lg,
      color: colors.text
    },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account', presentation: 'modal' }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Track Complaint', headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Details' }} />
          <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} options={{ title: 'Report Issue', headerShown: false }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Track Complaint' }} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics', headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}