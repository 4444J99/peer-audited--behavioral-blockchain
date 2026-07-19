import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import { parseSupportTraceMessage } from '../utils/support-trace';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ContractsStackParamList } from '../App';

type Props = NativeStackScreenProps<ContractsStackParamList, 'Attestation'>;

interface AttestationStatus {
  contract_id: string;
  oath_category: string;
  streak_days: number;
  days_remaining: number;
  grace_days_available: number;
  today_attested: boolean;
  total_strikes: number;
}

export function AttestationScreen({ route, navigation }: Props) {
  const { contractId } = route.params;
  const [status, setStatus] = useState<AttestationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const parsedError = parseSupportTraceMessage(error);

  useEffect(() => {
    loadStatus();
  }, [contractId]);

  const loadStatus = async () => {
    try {
      const data = await ApiClient.getAttestationStatus(contractId);
      setStatus(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load attestation status');
    } finally {
      setLoading(false);
    }
  };

  const handleAttest = async () => {
    setSubmitting(true);
    setError('');
    try {
      await ApiClient.submitAttestation(contractId);
      setConfirmed(true);
    } catch (err: any) {
      const parsed = parseSupportTraceMessage(err?.message || 'Failed to submit attestation');
      Alert.alert(
        'Error',
        parsed.traceId ? `${parsed.message}\n\nSupport trace ID: ${parsed.traceId}` : parsed.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff4444" size="large" />
      </View>
    );
  }

  if (error && !status) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{parsedError.message}</Text>
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

      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>{'🛡'}</Text>
        <Text style={styles.headerTitle}>Daily Attestation</Text>
        <Text style={styles.headerSubtitle}>Recovery Protocol Check-In</Text>
      </View>

      {status && !confirmed && (
        <>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{status.streak_days}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{status.days_remaining}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#888' }]}>{status.grace_days_available}</Text>
              <Text style={styles.statLabel}>Grace Days</Text>
            </View>
          </View>

          {/* Strike Warning */}
          {status.total_strikes > 0 && (
            <View style={styles.strikeWarning}>
              <Text style={styles.strikeText}>
                {status.total_strikes} missed attestation{status.total_strikes > 1 ? 's' : ''} — {3 - status.total_strikes} remaining before auto-fail
              </Text>
            </View>
          )}

          {/* Already Attested Today */}
          {status.today_attested ? (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>{'✓'}</Text>
              <Text style={styles.successTitle}>Already attested today</Text>
              <Text style={styles.successSubtitle}>Check back tomorrow for your next check-in.</Text>
            </View>
          ) : (
            <>
              {/* Prompt */}
              <View style={styles.promptCard}>
                <Text style={styles.promptText}>Did you maintain your commitment today?</Text>
                <Text style={styles.promptSubtext}>Your accountability partner will be notified to co-sign.</Text>
              </View>

              {/* Attest Button */}
              <TouchableOpacity
                style={[styles.attestButton, submitting && styles.attestButtonDisabled]}
                onPress={handleAttest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.attestButtonText}>I HELD THE LINE</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* Confirmed State */}
      {confirmed && (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>{'✓'}</Text>
          <Text style={styles.successTitle}>Attestation Recorded</Text>
          <Text style={styles.successSubtitle}>Your accountability partner has been notified to co-sign.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to Contract</Text>
          </TouchableOpacity>
        </View>
      )}
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

  headerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerTitle: { color: '#e0e0e0', fontSize: 22, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  headerSubtitle: { color: '#888', fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statValue: { color: '#e0e0e0', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  strikeWarning: {
    backgroundColor: '#ff444415',
    borderWidth: 1,
    borderColor: '#ff444430',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  strikeText: { color: '#ff6666', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  successCard: {
    backgroundColor: '#16a34a15',
    borderWidth: 1,
    borderColor: '#16a34a30',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: { color: '#22c55e', fontSize: 48, marginBottom: 12 },
  successTitle: { color: '#22c55e', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  successSubtitle: { color: '#888', fontSize: 13, textAlign: 'center' },

  promptCard: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  promptText: { color: '#e0e0e0', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  promptSubtext: { color: '#888', fontSize: 13, textAlign: 'center' },

  attestButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  attestButtonDisabled: { opacity: 0.5 },
  attestButtonText: { color: '#000', fontSize: 18, fontWeight: '800', letterSpacing: 1 },

  backButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  backButtonText: { color: '#e0e0e0', fontSize: 14, fontWeight: '600' },
});
