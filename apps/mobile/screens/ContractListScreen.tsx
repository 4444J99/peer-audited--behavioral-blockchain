import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import { parseSupportTraceMessage } from '../utils/support-trace';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ContractsStackParamList } from '../App';

type Props = NativeStackScreenProps<ContractsStackParamList, 'ContractList'>;

export function ContractListScreen({ navigation }: Props) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const parsedError = parseSupportTraceMessage(error);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateContract')}
          style={{ marginRight: 8 }}
        >
          <Text style={{ color: '#ff4444', fontSize: 14, fontWeight: '700' }}>+ New Oath</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadContracts = useCallback(async () => {
    try {
      const data = await ApiClient.getContracts();
      // data is directly the array of contracts
      setContracts(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadContracts(); }, [loadContracts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#2ecc71';
      case 'COMPLETED': return '#3498db';
      case 'FAILED': return '#e74c3c';
      case 'DISPUTED': return '#f39c12';
      default: return '#888';
    }
  };

  const renderContract = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ContractDetail', { contractId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.oath_category}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '30' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.stake}>${item.stake_amount.toFixed(2)} staked</Text>
        <Text style={styles.proofs}>{item.proof_count} proofs</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><Text style={styles.loadingText}>Loading oaths...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.error}>{parsedError.message}</Text>
          {parsedError.traceId ? (
            <Text style={styles.errorTrace}>Support trace ID: {parsedError.traceId}</Text>
          ) : null}
        </>
      ) : null}
      <FlatList
        data={contracts}
        keyExtractor={(item) => item.id}
        renderItem={renderContract}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContracts(); }} tintColor="#ff4444" />}
        ListEmptyComponent={<Text style={styles.emptyText}>No oaths yet. Take your first oath!</Text>}
        contentContainerStyle={contracts.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  errorTrace: { color: '#888', fontSize: 11, marginTop: -8, marginBottom: 12, paddingHorizontal: 4 },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  category: { color: '#ff4444', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  description: { color: '#e0e0e0', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  stake: { color: '#2ecc71', fontSize: 13, fontWeight: '600' },
  proofs: { color: '#888', fontSize: 13 },
  emptyText: { color: '#666', fontSize: 16, textAlign: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
