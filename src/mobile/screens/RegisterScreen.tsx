import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../App';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!ageConfirmed) {
      setError('You must confirm you are 18 or older');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await ApiClient.register(email, password, {
        ageConfirmation: true,
        termsAccepted: true,
      });
      Alert.alert('Account Created', 'You can now log in.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Join Styx</Text>
        <Text style={styles.subtitle}>Begin your journey of truth</Text>

        <SupportTraceErrorBanner
          value={error}
          messageStyle={styles.error}
          traceStyle={styles.errorTrace}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgeConfirmed(!ageConfirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
            {ageConfirmed ? <Text style={styles.checkmark}>{'✓'}</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>I confirm I am 18 years of age or older</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted ? <Text style={styles.checkmark}>{'✓'}</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            I accept the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (loading || !ageConfirmed || !termsAccepted) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || !ageConfirmed || !termsAccepted}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '85%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  error: {
    color: '#ff6666',
    backgroundColor: '#ff444420',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 13,
    overflow: 'hidden',
  },
  errorTrace: {
    color: '#888',
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#ff4444',
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
});
