'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertTriangle, Settings, Lock, Bell, Wallet,
  Eye, EyeOff, Trash2, ExternalLink, Check,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user: authUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  // Linguistic cloak
  const [cloakEnabled, setCloakEnabled] = useState(false);

  // UI state
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading || !authUser) return;
    // Load saved settings from localStorage
    const savedCloak = localStorage.getItem('styx_cloak_enabled');
    if (savedCloak !== null) {
      setCloakEnabled(savedCloak === 'true');
    }
    const savedEmailNotifs = localStorage.getItem('styx_email_notifs');
    if (savedEmailNotifs !== null) {
      setEmailNotifs(savedEmailNotifs === 'true');
    }
    const savedPushNotifs = localStorage.getItem('styx_push_notifs');
    if (savedPushNotifs !== null) {
      setPushNotifs(savedPushNotifs === 'true');
    }
  }, [authUser, authLoading]);

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must differ from current password' });
      return;
    }

    setSaving('password');
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      clearMessage();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setSaving('');
    }
  };

  const handleNotificationSave = async () => {
    setSaving('notifications');
    try {
      await api.updateSettings({ emailNotifications: emailNotifs, pushNotifications: pushNotifs });
      localStorage.setItem('styx_email_notifs', String(emailNotifs));
      localStorage.setItem('styx_push_notifs', String(pushNotifs));
      setMessage({ type: 'success', text: 'Notification preferences saved' });
      clearMessage();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save preferences' });
    } finally {
      setSaving('');
    }
  };

  const handleCloakToggle = () => {
    const next = !cloakEnabled;
    setCloakEnabled(next);
    localStorage.setItem('styx_cloak_enabled', String(next));
    setMessage({ type: 'success', text: next ? 'Linguistic cloak activated — neutral terminology enabled' : 'Stygian terminology restored' });
    clearMessage();
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This action cannot be undone. All your contracts, stakes, and history will be permanently deleted.')) {
      return;
    }
    if (!confirm('Final confirmation: Type "DELETE" in the next prompt to confirm.')) {
      return;
    }
    setSaving('delete');
    try {
      await api.deleteAccount();
      setMessage({ type: 'success', text: 'Account deletion request submitted. You will receive a confirmation email.' });
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to request account deletion' });
    } finally {
      setSaving('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-neutral-400 font-bold">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex items-center gap-3">
          <Settings className="text-neutral-400" size={28} />
          <h1 className="text-2xl font-black tracking-tight uppercase">Settings</h1>
        </div>
      </div>

      {/* Global Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-bold ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-red-900/20 border-red-800 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: Change Password */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-neutral-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 bg-black border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving === 'password' || !currentPassword || !newPassword || !confirmPassword}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              {saving === 'password' ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
              Update Password
            </button>
          </form>
        </div>

        {/* Section 2: Notification Preferences */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-neutral-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Notification Preferences</h2>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-neutral-800">
              <div>
                <p className="font-bold">Email Notifications</p>
                <p className="text-xs text-neutral-500">Contract updates, Fury verdicts, account alerts</p>
              </div>
              <button
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailNotifs ? 'bg-red-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  emailNotifs ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-neutral-800">
              <div>
                <p className="font-bold">Push Notifications</p>
                <p className="text-xs text-neutral-500">Real-time alerts for proof reviews and deadlines</p>
              </div>
              <button
                onClick={() => setPushNotifs(!pushNotifs)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  pushNotifs ? 'bg-red-600' : 'bg-neutral-700'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  pushNotifs ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <button
              onClick={handleNotificationSave}
              disabled={saving === 'notifications'}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              {saving === 'notifications' ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
              Save Preferences
            </button>
          </div>
        </div>

        {/* Section 3: Payment Methods */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="text-neutral-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Recovery Commitments</h2>
          </div>

          <p className="text-neutral-400 text-sm mb-4">
            Manage your simulated stakes, test-money balance, and Stripe configuration in the Commitment Wallet.
          </p>

          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl transition-colors"
          >
            <Wallet size={16} />
            Open Commitment Wallet
            <ExternalLink size={14} />
          </Link>
        </div>

        {/* Section 4: Linguistic Cloak */}
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="text-neutral-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm">Terminology</h2>
          </div>

          <p className="text-neutral-400 text-sm mb-4">
            Toggle between recovery-focused terminology (Commitment, Peer Review, Deposit) and 
            native Stygian wording (Oath, Fury, Stake). Affects all UI text across the app.
          </p>

          <div className="flex items-center justify-between p-4 bg-black rounded-xl border border-neutral-800 max-w-md">
            <div>
              <p className="font-bold">{cloakEnabled ? 'Neutral Mode' : 'Stygian Mode'}</p>
              <p className="text-xs text-neutral-500">
                {cloakEnabled
                  ? 'Using sanitized vocabulary (peer review, commitment, deposit)'
                  : 'Using native Styx vocabulary (Fury, Oath, Stake, Vault)'}
              </p>
            </div>
            <button
              onClick={handleCloakToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                cloakEnabled ? 'bg-blue-600' : 'bg-red-600'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                cloakEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Section 5: Danger Zone */}
        <div className="p-6 bg-neutral-900 border border-red-900/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="text-red-500" size={20} />
            <h2 className="font-bold uppercase tracking-widest text-sm text-red-500">Danger Zone</h2>
          </div>

          <p className="text-neutral-400 text-sm mb-4">
            Permanently delete your account, all contracts, stakes, proof history, and Fury audit records.
            Active escrow holds will be cancelled and refunded per Stripe policy. This action is <strong className="text-red-400">irreversible</strong>.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={saving === 'delete'}
            className="px-6 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {saving === 'delete' ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}
