import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';

export function FuryScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = useCallback(async () => {
    try {
      const data = await ApiClient.getFuryQueue();
      setQueue(data.assignments);
      setCurrentIndex(0);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const current = queue[currentIndex];

  const handleVerdict = async (verdict: 'VERIFY' | 'BURN') => {
    if (!current) return;
    setVerdictLoading(true);
    try {
      const result = await ApiClient.submitVerdict(current.id, verdict);
      if (result.bounty) {
        Alert.alert('Verdict Submitted', `Earned $${result.bounty.toFixed(2)} bounty`);
      }
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        await loadQueue();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setVerdictLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#ff4444" size="large" /></View>;
  }

  if (queue.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>{'⚖'}</Text>
        <Text style={styles.emptyTitle}>Queue Empty</Text>
        <Text style={styles.emptySubtext}>No proofs awaiting review</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadQueue}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Queue indicator */}
      <View style={styles.queueBar}>
        <Text style={styles.queueText}>
          Review {currentIndex + 1} of {queue.length}
        </Text>
      </View>

      {/* Proof display */}
      <View style={styles.proofCard}>
        <Text style={styles.proofCategory}>{current?.category}</Text>
        <View style={styles.mediaPlaceholder}>
          <Text style={styles.mediaIcon}>{'🎬'}</Text>
          <Text style={styles.mediaText}>Video Proof</Text>
          <Text style={styles.mediaSubtext}>Contract: {current?.contractId?.slice(0, 8)}...</Text>
        </View>
        <Text style={styles.proofDate}>
          Submitted: {new Date(current?.submittedAt).toLocaleString()}
        </Text>
      </View>

      {/* Verdict buttons */}
      <View style={styles.verdictRow}>
        <TouchableOpacity
          style={[styles.verdictButton, styles.verifyButton]}
          onPress={() => handleVerdict('VERIFY')}
          disabled={verdictLoading}
        >
          {verdictLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.verdictIcon}>{'✓'}</Text>
              <Text style={styles.verdictLabel}>VERIFY</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.verdictButton, styles.burnButton]}
          onPress={() => handleVerdict('BURN')}
          disabled={verdictLoading}
        >
          {verdictLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.verdictIcon}>{'🔥'}</Text>
              <Text style={styles.verdictLabel}>BURN</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#e0e0e0', fontSize: 20, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#888', fontSize: 14 },
  refreshButton: { marginTop: 20, backgroundColor: '#1a1a2e', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  refreshText: { color: '#ff4444', fontSize: 14, fontWeight: '600' },
  queueBar: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2a2a3e' },
  queueText: { color: '#888', fontSize: 13, fontWeight: '500' },
  proofCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  proofCategory: { color: '#ff4444', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  mediaPlaceholder: { flex: 1, backgroundColor: '#0a0a1a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  mediaIcon: { fontSize: 48, marginBottom: 8 },
  mediaText: { color: '#888', fontSize: 16, fontWeight: '500' },
  mediaSubtext: { color: '#555', fontSize: 12, marginTop: 4 },
  proofDate: { color: '#666', fontSize: 12 },
  verdictRow: { flexDirection: 'row', gap: 16 },
  verdictButton: { flex: 1, borderRadius: 12, padding: 20, alignItems: 'center' },
  verifyButton: { backgroundColor: '#2ecc71' },
  burnButton: { backgroundColor: '#e74c3c' },
  verdictIcon: { fontSize: 28, marginBottom: 4 },
  verdictLabel: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
});
