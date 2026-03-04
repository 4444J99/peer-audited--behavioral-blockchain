import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { SessionService } from './services/SessionService';
import { OfflineCache } from './services/OfflineCache';
import { ApiClient } from './services/ApiClient';
import { NotificationService } from './services/NotificationService';
import { linking, resolveNotificationDeepLink } from './config/linking';
import {
  getMobileBetaBannerText,
  getMobileBootstrapConfig,
  getMobileFeatureFlags,
  getLocalMobileBuild,
  getLocalMobileVersion,
  isBelowMinimumSupportedVersion,
  setMobileBootstrapConfig,
} from './config/beta';
import { resolveMobileAppBootstrapViewState } from './config/app-bootstrap-state';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ContractListScreen } from './screens/ContractListScreen';
import { ContractDetailScreen } from './screens/ContractDetailScreen';
import { CameraScreen } from './screens/CameraScreen';
import { AttestationScreen } from './screens/AttestationScreen';
import DigitalExhaustScreen from './screens/DigitalExhaustScreen';
import { CreateContractScreen } from './screens/CreateContractScreen';
import { FuryScreen } from './screens/FuryScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ContractsStackParamList = {
  ContractList: undefined;
  ContractDetail: { contractId: string };
  Attestation: { contractId: string };
  DigitalExhaust: { contractId: string; targetPhoneNumber: string };
  CreateContract: undefined;
  SubmitProof: { contractId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Contracts: undefined;
  Wallet: undefined;
  Fury: undefined;
  Camera: undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ContractsStack = createNativeStackNavigator<ContractsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function ContractsNavigator() {
  return (
    <ContractsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#e0e0e0',
      }}
    >
      <ContractsStack.Screen
        name="ContractList"
        component={ContractListScreen}
        options={{ title: 'My Oaths' }}
      />
      <ContractsStack.Screen
        name="ContractDetail"
        component={ContractDetailScreen}
        options={{ title: 'Oath Details' }}
      />
      <ContractsStack.Screen
        name="Attestation"
        component={AttestationScreen}
        options={{ title: 'Daily Check-In' }}
      />
      <ContractsStack.Screen
        name="DigitalExhaust"
        component={DigitalExhaustScreen}
        options={{ title: 'Automatic Verification' }}
      />
      <ContractsStack.Screen
        name="CreateContract"
        component={CreateContractScreen}
        options={{ title: 'New Oath' }}
      />
      <ContractsStack.Screen
        name="SubmitProof"
        component={CameraScreen}
        options={{ title: 'Submit Proof' }}
      />
    </ContractsStack.Navigator>
  );
}

function ProfileNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#e0e0e0',
      }}
    >
      <ProfileStack.Screen name="ProfileMain" options={{ title: 'Profile' }}>
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </ProfileStack.Screen>
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </ProfileStack.Navigator>
  );
}

function MainTabNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0a0a0f', borderTopColor: '#1a1a2e' },
        tabBarActiveTintColor: '#ff4444',
        tabBarInactiveTintColor: '#666',
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#e0e0e0',
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'⌂'}</Text>,
        }}
      />
      <MainTab.Screen
        name="Contracts"
        component={ContractsNavigator}
        options={{
          headerShown: false,
          title: 'Oaths',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'📜'}</Text>,
        }}
      />
      <MainTab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'💰'}</Text>,
        }}
      />
      <MainTab.Screen
        name="Fury"
        component={FuryScreen}
        options={{
          title: 'Fury',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'⚖'}</Text>,
        }}
      />
      {/* Camera/proof capture tab intentionally hidden until native capture pipeline is production-ready */}
      <MainTab.Screen
        name="Profile"
        options={{
          headerShown: false,
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'👤'}</Text>,
        }}
      >
        {() => <ProfileNavigator onLogout={onLogout} />}
      </MainTab.Screen>
    </MainTab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      SessionService.isLoggedIn(),
      ApiClient.getMobileBootstrap(),
      NotificationService.initialize(),
    ])
      .then((results) => {
        if (mounted) {
          const [sessionResult, bootstrapResult] = results;
          if (sessionResult.status === 'fulfilled') {
            setIsLoggedIn(sessionResult.value);
          } else {
            setIsLoggedIn(false);
          }

          if (bootstrapResult.status === 'fulfilled') {
            setMobileBootstrapConfig(bootstrapResult.value);
            setBootstrapError(null);
          } else {
            setBootstrapError('Unable to load beta configuration. Continuing with safe defaults.');
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle push notification taps → navigate via deep link
  useEffect(() => {
    let Notifications: typeof import('expo-notifications') | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Notifications = require('expo-notifications');
    } catch {
      return; // expo-notifications not available
    }

    const subscription = Notifications!.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const deepLink = resolveNotificationDeepLink(data as Record<string, any>);
      if (deepLink) {
        Linking.openURL(deepLink);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await SessionService.clearSession();
    await OfflineCache.clearAll();
    setIsLoggedIn(false);
  }, []);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ff4444" />
        <Text style={{ color: '#999', marginTop: 10 }}>Loading private beta…</Text>
      </View>
    );
  }

  const bootstrapConfig = getMobileBootstrapConfig();
  const appBootstrapState = resolveMobileAppBootstrapViewState({
    betaBannerText: getMobileBetaBannerText(),
    featureFlags: getMobileFeatureFlags(),
    bootstrapError,
    belowMinimumSupportedVersion: isBelowMinimumSupportedVersion(bootstrapConfig),
    localVersion: getLocalMobileVersion(),
    localBuild: getLocalMobileBuild(),
  });

  if (appBootstrapState.gate === 'maintenance') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#ff4444', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
          Maintenance Mode
        </Text>
        <Text style={{ color: '#e0e0e0', lineHeight: 22, marginBottom: 12 }}>
          {appBootstrapState.betaBannerText}
        </Text>
        <Text style={{ color: '#999', lineHeight: 20 }}>
          The private beta is temporarily paused while we stabilize the No-Contact recovery flow. Please try again later.
        </Text>
      </View>
    );
  }

  if (appBootstrapState.gate === 'update_required') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#ff4444', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
          Update Required
        </Text>
        <Text style={{ color: '#e0e0e0', lineHeight: 22, marginBottom: 12 }}>
          {appBootstrapState.betaBannerText}
        </Text>
        <Text style={{ color: '#999', lineHeight: 20 }}>
          {appBootstrapState.updateMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <View
        style={{
          backgroundColor: '#20150d',
          borderBottomColor: '#4a2a16',
          borderBottomWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text style={{ color: '#ffb26b', fontSize: 12, fontWeight: '700' }}>
          {appBootstrapState.betaBannerText}
        </Text>
        {appBootstrapState.showNoContactScopeNotice ? (
          <Text style={{ color: '#e0c7a6', fontSize: 11, marginTop: 2 }}>
            Phase 1 scope: No-Contact recovery path prioritized; other categories may be hidden.
          </Text>
        ) : null}
        {appBootstrapState.bootstrapError ? (
          <Text style={{ color: '#ffd5d5', fontSize: 11, marginTop: 2 }}>{appBootstrapState.bootstrapError}</Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <NavigationContainer linking={linking} ref={navigationRef}>
          {isLoggedIn ? (
            <MainTabNavigator onLogout={handleLogout} />
          ) : (
            <AuthStack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: '#0a0a0f' },
                headerTintColor: '#e0e0e0',
              }}
            >
              <AuthStack.Screen name="Login" options={{ headerShown: false }}>
                {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
              </AuthStack.Screen>
              <AuthStack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: 'Create Account' }}
              />
            </AuthStack.Navigator>
          )}
        </NavigationContainer>
      </View>
    </View>
  );
}
