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
import { parseSupportTraceMessage } from '../utils/support-trace';

interface DashboardScreenProps {
  navigation: any;
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [attestationInfo, setAttestationInfo] = useState<{
    contractId: string;
    streakDays: number;
    todayAttested: boolean;
    daysRemaining: number;
  } | null>(null);
  const [error, setError] = useState('');
  const parsedError = parseSupportTraceMessage(error);

  const loadData = useCallback(async () => {
    try {
      const [me, balanceData, notifs, contractsData] = await Promise.all([
        ApiClient.getMe(),
        ApiClient.getBalance().catch(() => null),
        ApiClient.getNotifications().catch(() => ({ notifications: [] })),
        ApiClient.getContracts().catch(() => []),
      ]);
      setProfile(me);
      setBalance(balanceData);
      setNotifications(notifs.notifications.slice(0, 5));

      // Find active recovery contract and fetch attestation status
      const activeRecovery = Array.isArray(contractsData)
        ? contractsData.find((c: any) => c.status === 'ACTIVE' && String(c.oath_category || '').startsWith('RECOVERY_'))
        : null;

      if (activeRecovery) {
        try {
          const attStatus = await ApiClient.getAttestationStatus(activeRecovery.id);
          setAttestationInfo({
            contractId: activeRecovery.id,
            streakDays: attStatus.streak_days,
            todayAttested: attStatus.today_attested,
            daysRemaining: attStatus.days_remaining,
          });
        } catch {
          setAttestationInfo(null);
        }
      } else {
        setAttestationInfo(null);
      }

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
      {error ? (
        <>
          <Text style={styles.error}>{parsedError.message}</Text>
          {parsedError.traceId ? (
            <Text style={styles.errorTrace}>Support trace ID: {parsedError.traceId}</Text>
          ) : null}
        </>
      ) : null}

      {/* Integrity Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>INTEGRITY SCORE</Text>
        <Text style={styles.scoreValue}>{profile?.integrity_score ?? 0}</Text>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(profile?.tier || '') }]}>
          <Text style={styles.tierText}>{profile?.tier || 'UNKNOWN'}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile?.contract_count ?? 0}</Text>
          <Text style={styles.statLabel}>Active Oaths</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>TEST-${profile?.total_staked?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Total Staked</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#84cc16' }]}>TEST-${balance?.ledger_balance?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Balance</Text>
        </View>
      </View>

      {/* Attestation Status Card */}
      {attestationInfo && (
        <TouchableOpacity
          style={styles.attestCard}
          onPress={() =>
            navigation.navigate('Contracts', {
              screen: 'Attestation',
              params: { contractId: attestationInfo.contractId },
            } as any)
          }
        >
          <View style={styles.attestCardHeader}>
            <Text style={styles.attestCardIcon}>{attestationInfo.todayAttested ? '✓' : '🛡'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.attestCardTitle}>
                {attestationInfo.todayAttested ? 'Checked In Today' : 'Daily Check-In'}
              </Text>
              <Text style={styles.attestCardSubtitle}>
                {attestationInfo.todayAttested
                  ? `${attestationInfo.streakDays}-day streak · ${attestationInfo.daysRemaining} days left`
                  : 'Tap to submit your daily attestation'}
              </Text>
            </View>
            {!attestationInfo.todayAttested && (
              <View style={styles.attestBadge}>
                <Text style={styles.attestBadgeText}>DUE</Text>
              </View>
            )}
          </View>
          {!attestationInfo.todayAttested && attestationInfo.streakDays > 0 && (
            <Text style={styles.attestStreakHint}>
              {attestationInfo.streakDays}-day streak at risk
            </Text>
          )}
        </TouchableOpacity>
      )}

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
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>{'👤'}</Text>
            <Text style={styles.actionLabel}>Profile</Text>
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
  errorTrace: { color: '#888', fontSize: 11, marginTop: -8, marginBottom: 12, paddingHorizontal: 4 },
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
  attestCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  attestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attestCardIcon: { fontSize: 28 },
  attestCardTitle: { color: '#e0e0e0', fontSize: 15, fontWeight: '700' },
  attestCardSubtitle: { color: '#888', fontSize: 12, marginTop: 2 },
  attestBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  attestBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  attestStreakHint: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
