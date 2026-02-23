import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';

export function CameraScreen() {
  const [contractId, setContractId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!contractId.trim()) {
      Alert.alert('Error', 'Enter a contract ID first');
      return;
    }
    setSubmitting(true);
    try {
      // In a real app, this would use react-native-camera to capture
      // For now, submit a proof without media (text-based proof)
      const result = await ApiClient.submitProof(contractId.trim(), {
        notes: notes || 'Proof submitted from mobile camera',
      });
      setLastResult(`Proof submitted! ID: ${result.proofId}`);
      setNotes('');
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraIcon}>{'📷'}</Text>
        <Text style={styles.cameraText}>Camera Preview</Text>
        <Text style={styles.cameraSubtext}>
          {'Camera integration requires native module.\nUse text proof submission below.'}
        </Text>
      </View>

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="Contract ID"
          placeholderTextColor="#666"
          value={contractId}
          onChangeText={setContractId}
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Proof notes (optional)"
          placeholderTextColor="#666"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.captureButton, submitting && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View style={styles.captureInner}>
              <Text style={styles.captureText}>SUBMIT PROOF</Text>
            </View>
          )}
        </TouchableOpacity>

        {lastResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{lastResult}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '40%',
  },
  cameraIcon: { fontSize: 48, marginBottom: 8 },
  cameraText: { color: '#888', fontSize: 16, fontWeight: '600' },
  cameraSubtext: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
  controls: { padding: 16 },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 12,
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },
  captureButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  captureButtonDisabled: { backgroundColor: '#333' },
  captureInner: { alignItems: 'center' },
  captureText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  resultBox: {
    backgroundColor: '#2ecc7120',
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  resultText: { color: '#2ecc71', fontSize: 13 },
});
