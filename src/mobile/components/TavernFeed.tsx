import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Platform } from 'react-native';

const API_BASE = 'http://localhost:3000'; // TODO: use env variable

interface FeedEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

const EVENT_ICONS: Record<string, string> = {
  PROOF_VERIFIED: '✅',
  CONTRACT_COMPLETED: '🏆',
  CONTRACT_FAILED: '💀',
  FURY_BOUNTY_PAID: '💰',
  APPEAL_INITIATED: '⚖️',
  DISPUTE_RESOLVED: '🔨',
  HONEYPOT_CAUGHT: '🎯',
  STREAK_MILESTONE: '🔥',
};

export default function TavernFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  /** Load initial feed events via REST */
  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/feed?limit=20`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      // Keep existing events on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** Connect to SSE stream for real-time updates */
  useEffect(() => {
    loadFeed();

    // SSE is supported on React Native via polyfill or native EventSource
    try {
      const es = new EventSource(`${API_BASE}/feed/stream`);

      es.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.events && data.events.length > 0) {
            setEvents(prev => {
              const newEvents = [...data.events, ...prev];
              // Keep max 50 events to prevent memory bloat
              return newEvents.slice(0, 50);
            });
          }
        } catch {
          // Ignore malformed SSE data
        }
      };

      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);

      eventSourceRef.current = es;
    } catch {
      // EventSource not available — fall back to polling
      const interval = setInterval(loadFeed, 10000);
      return () => clearInterval(interval);
    }

    return () => {
      eventSourceRef.current?.close();
    };
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const formatTime = (ts: string): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>⚔️ The Tavern</Text>
        <ActivityIndicator color="#ef4444" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>⚔️ The Tavern</Text>
        <View style={[styles.statusDot, connected ? styles.statusConnected : styles.statusDisconnected]} />
      </View>
      <Text style={styles.subheader}>Live Activity Feed</Text>

      {/* Event List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No events yet. The arena awaits.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.feedCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.eventIcon}>
                {EVENT_ICONS[item.type] || '📢'}
              </Text>
            </View>
            <View style={styles.entryDetails}>
              <Text style={styles.eventText}>{item.message}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.typeTag}>{item.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
              </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusConnected: {
    backgroundColor: '#22c55e',
  },
  statusDisconnected: {
    backgroundColor: '#666',
  },
  subheader: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  feedCard: {
    backgroundColor: '#111',
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 18,
  },
  entryDetails: {
    flex: 1,
  },
  eventText: {
    color: '#ddd',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  typeTag: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timeText: {
    color: '#555',
    fontSize: 11,
  },
});
