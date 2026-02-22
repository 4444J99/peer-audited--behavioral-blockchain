import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function TavernFeed() {
  const feedItems = [
    { id: '1', event: 'usr_8a2 just committed $250 to a 3-month weight-loss vault.', time: '2m ago' },
    { id: '2', event: 'SYSTEM: Honeypot Failed. 3 reviewers penalized.', time: '15m ago' },
    { id: '3', event: 'usr_1c9 successfully completed their oath. +150 Integrity Score.', time: '1h ago' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>The Tavern</Text>
      <Text style={styles.subheader}>Live Global Ledger Feed</Text>

      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.feedCard}>
            <Text style={styles.eventText}>{item.event}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
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
  feedCard: {
    backgroundColor: '#111',
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
    borderRadius: 8,
  },
  eventText: {
    color: '#ddd',
    fontSize: 14,
    marginBottom: 5,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
});
