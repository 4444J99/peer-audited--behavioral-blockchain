import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';

const TX_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FURY_BOUNTY: { label: 'Fury Bounty Earned', color: '#84cc16' },
  FURY_PENALTY: { label: 'Fury Penalty', color: '#ef4444' },
  STAKE_HOLD: { label: 'Stake Held', color: '#eab308' },
  STAKE_RELEASE: { label: 'Stake Released', color: '#22c55e' },
  STAKE_BURN: { label: 'Stake Burned', color: '#ef4444' },
  ONBOARDING_BONUS: { label: 'Onboarding Bonus', color: '#84cc16' },
  APPEAL_FEE: { label: 'Appeal Fee', color: '#f97316' },
};

function getTxLabel(type: string): { label: string; color: string } {
  return TX_TYPE_LABELS[type] || { label: type || 'Transaction', color: '#888' };
}

interface Balance {
  integrity_score: number;
  allowed_tiers: string[];
  ledger_balance: number;
  status: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  timestamp: string;
  description: string;
}

interface WalletScreenProps {
  navigation: any;
}

export function WalletScreen({ navigation }: WalletScreenProps) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [balanceData, historyData] = await Promise.all([
        ApiClient.getBalance(),
        ApiClient.getWalletHistory(30),
      ]);
      setBalance(balanceData);
      setTransactions(historyData.transactions);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      setLoading(true);
      loadData();
    };

    refreshOnFocus();
    const unsubscribe = navigation?.addListener?.('focus', refreshOnFocus);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadData, navigation]);

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

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const { label, color } = getTxLabel(item.type);
    return (
      <View style={styles.txItem}>
        <View style={styles.txLeft}>
          <Text style={[styles.txLabel, { color }]}>{label}</Text>
          {item.description ? (
            <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
        <View style={styles.txRight}>
          <Text style={styles.txAmount}>TEST-${item.amount.toFixed(2)}</Text>
          <Text style={styles.txDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {balance && (
        <>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>LEDGER BALANCE (TEST)</Text>
            <Text style={styles.balanceValue}>TEST-${balance.ledger_balance.toFixed(2)}</Text>
            <Text style={[styles.statusText, { color: balance.status === 'ACTIVE' ? '#84cc16' : '#ef4444' }]}>
              {balance.status}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>INTEGRITY</Text>
              <Text style={styles.statValue}>{balance.integrity_score}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TIERS</Text>
              <View style={styles.tiersContainer}>
                {balance.allowed_tiers.map((tier) => (
                  <View key={tier} style={[styles.tierBadge, { backgroundColor: getTierColor(tier) + '30' }]}>
                    <Text style={[styles.tierText, { color: getTierColor(tier) }]}>{tier}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Transaction History</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={renderTransaction}
      ListHeaderComponent={ListHeader}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4444" />}
      ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  balanceLabel: { color: '#888', fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  balanceValue: { color: '#84cc16', fontSize: 48, fontWeight: '800' },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statLabel: { color: '#888', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  statValue: { color: '#e0e0e0', fontSize: 28, fontWeight: '700' },
  tiersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  sectionTitle: { color: '#e0e0e0', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  txItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  txLeft: { flex: 1, marginRight: 12 },
  txLabel: { fontSize: 13, fontWeight: '600' },
  txDesc: { color: '#555', fontSize: 11, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { color: '#e0e0e0', fontSize: 16, fontWeight: '700' },
  txDate: { color: '#555', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
});
