import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';

export function SettingsScreen() {
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // UI state
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      showMessage('error', 'Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      showMessage('error', 'New password must differ from current password');
      return;
    }

    setSaving('password');
    try {
      await ApiClient.changePassword(currentPassword, newPassword);
      showMessage('success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update password');
    } finally {
      setSaving('');
    }
  };

  const handleNotificationSave = async () => {
    setSaving('notifications');
    try {
      await ApiClient.updateSettings({ emailNotifications: emailNotifs, pushNotifications: pushNotifs });
      showMessage('success', 'Notification preferences saved');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to save preferences');
    } finally {
      setSaving('');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your contracts, stakes, and history will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving('delete');
            try {
              await ApiClient.deleteAccount();
              Alert.alert('Account Deleted', 'Your account deletion request has been submitted.');
            } catch (err: any) {
              showMessage('error', err.message || 'Failed to delete account');
            } finally {
              setSaving('');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Global Message */}
      {message && (
        <View style={[styles.messageBox, message.type === 'success' ? styles.messageSuccess : styles.messageError]}>
          <Text style={[styles.messageText, message.type === 'success' ? styles.messageTextSuccess : styles.messageTextError]}>
            {message.text}
          </Text>
        </View>
      )}

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password (min. 8 characters)"
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="none"
        />
        {newPassword.length > 0 && newPassword.length < 8 && (
          <Text style={styles.fieldWarning}>Password must be at least 8 characters</Text>
        )}
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="none"
        />
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <Text style={styles.fieldWarning}>Passwords do not match</Text>
        )}
        <TouchableOpacity
          style={[styles.button, (!currentPassword || !newPassword || !confirmPassword) && styles.buttonDisabled]}
          onPress={handlePasswordChange}
          disabled={saving === 'password' || !currentPassword || !newPassword || !confirmPassword}
        >
          {saving === 'password' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Notification Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Email Notifications</Text>
            <Text style={styles.toggleDesc}>Contract updates, Fury verdicts, account alerts</Text>
          </View>
          <Switch
            value={emailNotifs}
            onValueChange={setEmailNotifs}
            trackColor={{ false: '#333', true: '#ff444480' }}
            thumbColor={emailNotifs ? '#ff4444' : '#888'}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleDesc}>Real-time alerts for proof reviews and deadlines</Text>
          </View>
          <Switch
            value={pushNotifs}
            onValueChange={setPushNotifs}
            trackColor={{ false: '#333', true: '#ff444480' }}
            thumbColor={pushNotifs ? '#ff4444' : '#888'}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleNotificationSave}
          disabled={saving === 'notifications'}
        >
          {saving === 'notifications' ? (
            <ActivityIndicator color="#e0e0e0" size="small" />
          ) : (
            <Text style={styles.buttonTextSecondary}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerDesc}>
          Permanently delete your account, all contracts, stakes, proof history, and Fury audit records.
          Active escrow holds will be cancelled and refunded. This action is irreversible.
        </Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDeleteAccount}
          disabled={saving === 'delete'}
        >
          {saving === 'delete' ? (
            <ActivityIndicator color="#e74c3c" size="small" />
          ) : (
            <Text style={styles.dangerButtonText}>Delete My Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Styx Mobile v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  messageBox: { padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  messageSuccess: { backgroundColor: '#22c55e10', borderColor: '#22c55e40' },
  messageError: { backgroundColor: '#ff444420', borderColor: '#ff444440' },
  messageText: { fontSize: 13, fontWeight: '600' },
  messageTextSuccess: { color: '#22c55e' },
  messageTextError: { color: '#ff6666' },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  sectionTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
    marginBottom: 10,
  },
  fieldWarning: { color: '#f39c12', fontSize: 11, marginBottom: 8, marginTop: -4 },
  button: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  buttonSecondary: { backgroundColor: '#2a2a3e' },
  buttonTextSecondary: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
  toggleDesc: { color: '#555', fontSize: 11, marginTop: 2 },
  dangerSection: { borderColor: '#e74c3c30' },
  dangerTitle: { color: '#e74c3c', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  dangerDesc: { color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  dangerButton: {
    backgroundColor: '#e74c3c15',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  dangerButtonText: { color: '#e74c3c', fontSize: 14, fontWeight: '700' },
  version: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 40 },
});
