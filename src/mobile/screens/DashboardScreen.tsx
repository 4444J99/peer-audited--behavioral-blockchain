import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import { useNavigation } from '@react-navigation/native';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [me, balanceData, notifs] = await Promise.all([
        ApiClient.getMe(),
        ApiClient.getBalance().catch(() => null),
        ApiClient.getNotifications().catch(() => ({ notifications: [] })),
      ]);
      setProfile(me);
      setBalance(balanceData);
      setNotifications(notifs.notifications.slice(0, 5));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'WHALE': return '#ffd700';
      case 'HIGH_ROLLER': return '#9b59b6';
      case 'STANDARD': return '#3498db';
      case 'MICRO': return '#2ecc71';
      default: return '#e74c3c';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4444" />}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Integrity Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>INTEGRITY SCORE</Text>
        <Text style={styles.scoreValue}>{profile?.integrity ?? 0}</Text>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(profile?.tier || '') }]}>
          <Text style={styles.tierText}>{profile?.tier || 'UNKNOWN'}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.contractCount ?? 0}</Text>
          <Text style={styles.statLabel}>Active Oaths</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${profile?.totalStaked?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Total Staked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#84cc16' }]}>${balance?.ledgerBalance?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Contracts', { screen: 'CreateContract' } as any)}
          >
            <Text style={styles.actionIcon}>{'📜'}</Text>
            <Text style={styles.actionLabel}>New Oath</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.actionIcon}>{'💰'}</Text>
            <Text style={styles.actionLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Fury')}
          >
            <Text style={styles.actionIcon}>{'⚖'}</Text>
            <Text style={styles.actionLabel}>Fury Queue</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.notifItem}>
              <Text style={styles.notifMessage}>{n.message}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  centerContainer: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  scoreCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  scoreLabel: { color: '#888', fontSize: 12, letterSpacing: 2, marginBottom: 8 },
  scoreValue: { color: '#ff4444', fontSize: 64, fontWeight: '800' },
  tierBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  tierText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statValue: { color: '#e0e0e0', fontSize: 24, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#e0e0e0', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: '#e0e0e0', fontSize: 13, fontWeight: '500' },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  notifItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  notifMessage: { color: '#e0e0e0', fontSize: 14 },
  notifTime: { color: '#666', fontSize: 11, marginTop: 4 },
});
