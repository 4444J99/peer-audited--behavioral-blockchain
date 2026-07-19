import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { CameraModule } from '../components/CameraModule';

interface CameraScreenProps {
  route?: {
    params?: {
      contractId?: string;
    };
  };
}

export function CameraScreen({ route }: CameraScreenProps = {}) {
  const routeContractId = route?.params?.contractId;
  const [contractId, setContractId] = useState(routeContractId || '');

  useEffect(() => {
    if (routeContractId) {
      setContractId(routeContractId);
    }
  }, [routeContractId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Proof Capture</Text>
        <Text style={styles.subtitle}>
          Enter the contract ID and record a live proof. Gallery uploads are disabled.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Contract ID"
          placeholderTextColor="#666"
          value={contractId}
          onChangeText={setContractId}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.captureArea}>
        <CameraModule contractId={contractId.trim() || undefined} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1b29',
    backgroundColor: '#0f0f17',
  },
  title: {
    color: '#e7e7f5',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8c8ca6',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#e0e0e0',
    fontSize: 14,
  },
  captureArea: {
    flex: 1,
    backgroundColor: '#000',
  },
});
