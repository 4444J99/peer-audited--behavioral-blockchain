import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import { parseSupportTraceMessage } from '../utils/support-trace';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ContractsStackParamList } from '../App';

type Props = NativeStackScreenProps<ContractsStackParamList, 'ContractDetail'>;

export function ContractDetailScreen({ route, navigation }: Props) {
  const { contractId } = route.params;
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const parsedError = parseSupportTraceMessage(error);

  useEffect(() => {
    loadContract();
  }, [contractId]);

  const loadContract = async () => {
    try {
      const data = await ApiClient.getContract(contractId);
      setContract(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    setActionLoading('proof');
    try {
      await ApiClient.submitProof(contractId, { notes: 'Submitted from mobile' });
      await loadContract();
    } catch (err: any) {
      const parsed = parseSupportTraceMessage(err?.message || 'Action failed');
      Alert.alert(
        'Error',
        parsed.traceId ? `${parsed.message}\n\nSupport trace ID: ${parsed.traceId}` : parsed.message,
      );
    } finally {
      setActionLoading('');
    }
  };

  const handleGraceDay = async () => {
    setActionLoading('grace');
    try {
      const result = await ApiClient.useGraceDay(contractId);
      Alert.alert('Grace Day Used', `${result.graceDaysRemaining} remaining`);
      await loadContract();
    } catch (err: any) {
      const parsed = parseSupportTraceMessage(err?.message || 'Action failed');
      Alert.alert(
        'Error',
        parsed.traceId ? `${parsed.message}\n\nSupport trace ID: ${parsed.traceId}` : parsed.message,
      );
    } finally {
      setActionLoading('');
    }
  };

  const handleDispute = async () => {
    // Alert.prompt is iOS-only; fall back to a simple confirmation on Android
    if (Platform.OS === 'ios') {
      Alert.prompt('File Dispute', 'Enter your reason:', async (reason) => {
        if (!reason) return;
        setActionLoading('dispute');
        try {
          await ApiClient.fileDispute(contractId, reason);
          Alert.alert('Dispute Filed', 'Your dispute has been submitted for review.');
          await loadContract();
        } catch (err: any) {
          const parsed = parseSupportTraceMessage(err?.message || 'Action failed');
          Alert.alert(
            'Error',
            parsed.traceId ? `${parsed.message}\n\nSupport trace ID: ${parsed.traceId}` : parsed.message,
          );
        } finally {
          setActionLoading('');
        }
      });
    } else {
      // On Android, submit a generic dispute reason
      setActionLoading('dispute');
      try {
        await ApiClient.fileDispute(contractId, 'Disputed from mobile');
        Alert.alert('Dispute Filed', 'Your dispute has been submitted for review.');
        await loadContract();
      } catch (err: any) {
        const parsed = parseSupportTraceMessage(err?.message || 'Action failed');
        Alert.alert(
          'Error',
          parsed.traceId ? `${parsed.message}\n\nSupport trace ID: ${parsed.traceId}` : parsed.message,
        );
      } finally {
        setActionLoading('');
      }
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#ff4444" size="large" /></View>;
  }

  if (!contract) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{parsedError.message || 'Contract not found'}</Text>
        {parsedError.traceId ? (
          <Text style={styles.errorTraceCenter}>Support trace ID: {parsedError.traceId}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {error ? (
        <>
          <Text style={styles.error}>{parsedError.message}</Text>
          {parsedError.traceId ? (
            <Text style={styles.errorTrace}>Support trace ID: {parsedError.traceId}</Text>
          ) : null}
        </>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.category}>{contract.category}</Text>
        <Text style={styles.status}>{contract.status}</Text>
      </View>

      <Text style={styles.description}>{contract.description}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>${contract.stakeAmount.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Staked</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{contract.proofs?.length || 0}</Text>
          <Text style={styles.statLabel}>Proofs</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{contract.graceDaysUsed}/{contract.graceDaysMax}</Text>
          <Text style={styles.statLabel}>Grace Days</Text>
        </View>
      </View>

      <View style={styles.dates}>
        <Text style={styles.dateText}>Start: {new Date(contract.startDate).toLocaleDateString()}</Text>
        <Text style={styles.dateText}>End: {new Date(contract.endDate).toLocaleDateString()}</Text>
      </View>

      {contract.status === 'ACTIVE' && String(contract.category || '').startsWith('RECOVERY_') && (
        <View style={{ gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            style={styles.attestButton}
            onPress={() => navigation.navigate('Attestation', { contractId })}
          >
            <Text style={styles.attestButtonText}>Daily Check-In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.attestButton, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#ef444430' }]}
            onPress={() => navigation.navigate('DigitalExhaust', { 
              contractId, 
              targetPhoneNumber: contract.metadata?.targetPhoneNumber || 'Restricted Target' 
            })}
          >
            <Text style={[styles.attestButtonText, { color: '#ef4444' }]}>Automatic Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {contract.status === 'ACTIVE' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitProof} disabled={!!actionLoading}>
            {actionLoading === 'proof' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Proof</Text>}
          </TouchableOpacity>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGraceDay} disabled={!!actionLoading}>
              <Text style={styles.secondaryButtonText}>Use Grace Day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, styles.dangerButton]} onPress={handleDispute} disabled={!!actionLoading}>
              <Text style={styles.dangerButtonText}>File Dispute</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Proof History */}
      <View style={styles.proofSection}>
        <Text style={styles.sectionTitle}>Proof History</Text>
        {contract.proofs?.length === 0 ? (
          <Text style={styles.emptyText}>No proofs submitted yet</Text>
        ) : (
          contract.proofs?.map((proof: any) => (
            <View key={proof.id} style={styles.proofItem}>
              <Text style={styles.proofStatus}>{proof.status}</Text>
              <Text style={styles.proofDate}>{new Date(proof.timestamp).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ff6666', fontSize: 16 },
  errorTraceCenter: { color: '#888', fontSize: 11, marginTop: 8 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  errorTrace: { color: '#888', fontSize: 11, marginTop: -8, marginBottom: 12, paddingHorizontal: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  category: { color: '#ff4444', fontSize: 14, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  status: { color: '#2ecc71', fontSize: 13, fontWeight: '600' },
  description: { color: '#e0e0e0', fontSize: 16, lineHeight: 24, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3e' },
  statValue: { color: '#e0e0e0', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  dates: { marginBottom: 20 },
  dateText: { color: '#888', fontSize: 13, marginBottom: 4 },
  actions: { marginBottom: 24 },
  primaryButton: { backgroundColor: '#ff4444', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryActions: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3e' },
  secondaryButtonText: { color: '#e0e0e0', fontSize: 13, fontWeight: '500' },
  dangerButton: { borderColor: '#e74c3c30' },
  dangerButtonText: { color: '#e74c3c', fontSize: 13, fontWeight: '500' },
  proofSection: { marginBottom: 32 },
  sectionTitle: { color: '#e0e0e0', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  proofItem: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2a2a3e' },
  proofStatus: { color: '#2ecc71', fontSize: 13, fontWeight: '600' },
  proofDate: { color: '#888', fontSize: 12 },
  attestButton: { backgroundColor: '#f59e0b', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  attestButtonText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
