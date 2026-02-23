import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await ApiClient.getMe();
      setProfile(data);
    } catch (_err) {
      // Silently fail - show what we can
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

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
    return <View style={styles.center}><Text style={styles.loadingText}>Loading profile...</Text></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} tintColor="#ff4444" />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.email?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.email}>{profile?.email || 'Unknown'}</Text>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(profile?.tier || '') }]}>
          <Text style={styles.tierText}>{profile?.tier || 'UNKNOWN'}</Text>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>INTEGRITY</Text>
        <Text style={styles.scoreValue}>{profile?.integrity ?? 0}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile?.contractCount ?? 0}</Text>
          <Text style={styles.statLabel}>Contracts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${profile?.totalStaked?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Total Staked</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Styx Mobile v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  profileHeader: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ff4444', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  email: { color: '#e0e0e0', fontSize: 16, marginBottom: 8 },
  tierBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
  tierText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  scoreSection: { alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a3e' },
  scoreLabel: { color: '#888', fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  scoreValue: { color: '#ff4444', fontSize: 48, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statItem: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3e' },
  statValue: { color: '#e0e0e0', fontSize: 20, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  logoutButton: { backgroundColor: '#e74c3c20', borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  logoutText: { color: '#e74c3c', fontSize: 15, fontWeight: '600' },
  version: { color: '#444', fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 32 },
});
