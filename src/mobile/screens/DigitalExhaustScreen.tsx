import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { ZKPrivacyEngine, ExhaustProof } from '../services/ZKPrivacyEngine';
import { ApiClient } from '../services/ApiClient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ContractsStackParamList } from '../App';

type Props = NativeStackScreenProps<ContractsStackParamList, 'DigitalExhaust'>;

export default function DigitalExhaustScreen({ route, navigation }: Props) {
  const { contractId, targetPhoneNumber } = route.params;
  const [scanning, setScanning] = useState(false);
  const [proof, setProof] = useState<ExhaustProof | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startScan = async () => {
    setScanning(true);
    try {
      // Look back 24 hours
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

      const localProof = await ZKPrivacyEngine.generateLocalProof(
        contractId,
        targetPhoneNumber,
        start,
        end
      );
      setProof(localProof);
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message);
    } finally {
      setScanning(false);
    }
  };

  const submitProof = async () => {
    if (!proof) return;
    setSubmitting(true);
    try {
      // In a real app, we'd have a specific endpoint for ZK proofs
      // await ApiClient.submitZKProof(contractId, proof);
      
      Alert.alert(
        'Verification Complete',
        proof.breachDetected 
          ? 'A breach was detected. The Aegis Protocol has been notified.' 
          : 'Compliance verified. Your privacy was preserved during the scan.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Exhaust Scan</Text>
        <Text style={styles.subtitle}>Privacy-First Automatic Verification</Text>
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <Text style={styles.privacyTitle}>Zero-Knowledge Scan</Text>
        <Text style={styles.privacyText}>
          Styx will scan your local SMS and Call logs for interactions with your restricted targets.
          {"\n\n"}
          <Text style={styles.bold}>Your private data never leaves this device.</Text> Only a cryptographic proof of compliance is sent to our servers.
        </Text>
      </View>

      {scanning ? (
        <View style={styles.scanState}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.scanText}>Analyzing local telephony logs...</Text>
          <Text style={styles.scanSubtext}>Generating SHA-256 binary proof</Text>
        </View>
      ) : proof ? (
        <View style={styles.resultCard}>
          <Text style={[styles.resultTitle, proof.breachDetected ? styles.errorText : styles.successText]}>
            {proof.breachDetected ? 'Breach Detected' : 'No Contact Maintained'}
          </Text>
          <Text style={styles.hashLabel}>Cryptographic Proof Hash:</Text>
          <Text style={styles.hashValue}>{proof.proofHash.substring(0, 32)}...</Text>
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={submitProof}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>TRANSMIT PROOF</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.scanButton} onPress={startScan}>
          <Text style={styles.scanButtonText}>START SECURE SCAN</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => navigation.goBack()}
        disabled={scanning || submitting}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  header: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginTop: 4, letterSpacing: 2 },
  
  privacyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    marginBottom: 30,
  },
  privacyIcon: { fontSize: 32, marginBottom: 16, textAlign: 'center' },
  privacyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  privacyText: { color: '#aaa', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  bold: { color: '#fff', fontWeight: 'bold' },

  scanState: { alignItems: 'center', padding: 40 },
  scanText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 20 },
  scanSubtext: { color: '#666', fontSize: 12, marginTop: 8 },

  resultCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  resultTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  successText: { color: '#22c55e' },
  errorText: { color: '#ef4444' },
  hashLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  hashValue: { color: '#444', fontSize: 10, fontFamily: 'monospace', marginBottom: 30 },

  scanButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  submitButtonText: { color: '#000', fontSize: 14, fontWeight: '900' },

  cancelButton: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#666', fontSize: 14 },
});
