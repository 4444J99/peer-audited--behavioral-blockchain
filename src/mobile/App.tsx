import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SessionService } from './services/SessionService';

// Screens
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ContractListScreen } from './screens/ContractListScreen';
import { ContractDetailScreen } from './screens/ContractDetailScreen';
import { CreateContractScreen } from './screens/CreateContractScreen';
import { CameraScreen } from './screens/CameraScreen';
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
        name="CreateContract"
        component={CreateContractScreen}
        options={{ title: 'New Oath' }}
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
      <MainTab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Prove',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{'📷'}</Text>,
        }}
      />
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

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await SessionService.clearSession();
    setIsLoggedIn(false);
  }, []);

  return (
    <NavigationContainer>
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
  );
}
