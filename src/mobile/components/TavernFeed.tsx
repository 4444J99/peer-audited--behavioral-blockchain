import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { ApiClient } from '../services/ApiClient';

interface LeaderEntry {
  rank: number;
  anonymousId: string;
  integrity: number;
  completedContracts: number;
}

export default function TavernFeed() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await ApiClient.getLeaderboard();
      setLeaders(data.leaders);
      setError('');
    } catch (err: any) {
      setError(err.message);
      // Fall back to static data if API is unreachable
      if (leaders.length === 0) {
        setLeaders([
          { rank: 1, anonymousId: 'usr_8a2', integrity: 150, completedContracts: 12 },
          { rank: 2, anonymousId: 'usr_1c9', integrity: 120, completedContracts: 8 },
          { rank: 3, anonymousId: 'usr_4f7', integrity: 95, completedContracts: 5 },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [leaders.length]);

  useEffect(() => { loadLeaderboard(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>The Tavern</Text>
        <ActivityIndicator color="#ff4444" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>The Tavern</Text>
      <Text style={styles.subheader}>Global Leaderboard</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.anonymousId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4444" />}
        renderItem={({ item }) => (
          <View style={styles.feedCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{item.rank}</Text>
            </View>
            <View style={styles.entryDetails}>
              <Text style={styles.eventText}>{item.anonymousId}</Text>
              <Text style={styles.timeText}>
                Integrity: {item.integrity} | Completed: {item.completedContracts}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  errorText: {
    color: '#ff6666',
    fontSize: 12,
    marginBottom: 10,
  },
  feedCard: {
    backgroundColor: '#111',
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff444430',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '700',
  },
  entryDetails: {
    flex: 1,
  },
  eventText: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '600',
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
});
