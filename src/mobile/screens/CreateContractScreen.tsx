import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiClient } from '../services/ApiClient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ContractsStackParamList } from '../App';
import { MIN_SAFE_BMI, MAX_WEEKLY_LOSS_VELOCITY_PCT } from '@styx/shared/libs/behavioral-logic';

type Props = NativeStackScreenProps<ContractsStackParamList, 'CreateContract'>;

const OATH_CATEGORIES = [
  { value: 'BIOLOGICAL_WEIGHT', label: 'Weight Management', stream: 'Biological' },
  { value: 'BIOLOGICAL_CARDIO', label: 'Cardiovascular Stamina', stream: 'Biological' },
  { value: 'BIOLOGICAL_METABOLIC', label: 'Glucose Stability', stream: 'Biological' },
  { value: 'BIOLOGICAL_SLEEP', label: 'Sleep Integrity', stream: 'Biological' },
  { value: 'BIOLOGICAL_SOBRIETY', label: 'Sobriety HRV', stream: 'Biological' },
  { value: 'COGNITIVE_DIGITAL', label: 'Digital Fasting', stream: 'Cognitive' },
  { value: 'COGNITIVE_FOCUS', label: 'Deep Work Focus', stream: 'Cognitive' },
  { value: 'COGNITIVE_QUEUE', label: 'Inbox Zero', stream: 'Cognitive' },
  { value: 'COGNITIVE_LEARNING', label: 'Learning Retention', stream: 'Cognitive' },
  { value: 'PROFESSIONAL_SALES', label: 'Sales Velocity', stream: 'Professional' },
  { value: 'PROFESSIONAL_CODE', label: 'Developer Throughput', stream: 'Professional' },
  { value: 'PROFESSIONAL_TIME', label: 'Punctuality', stream: 'Professional' },
  { value: 'CREATIVE_WRITING', label: 'Deep Writing', stream: 'Creative' },
  { value: 'CREATIVE_ART', label: 'Visual Arts', stream: 'Creative' },
  { value: 'CREATIVE_MUSIC', label: 'Music Practice', stream: 'Creative' },
  { value: 'CREATIVE_BUILD', label: 'Maker Build', stream: 'Creative' },
  { value: 'VISUAL_NUTRITION', label: 'Nutritional Transparency', stream: 'Environmental' },
  { value: 'VISUAL_ENVIRONMENT', label: 'Tidiness & Minimalism', stream: 'Environmental' },
  { value: 'VISUAL_IMAGE', label: 'Personal Presentation', stream: 'Environmental' },
  { value: 'VISUAL_LITERACY', label: 'Active Reading', stream: 'Environmental' },
  { value: 'SOCIAL_COMMUNITY', label: 'Civic Engagement', stream: 'Character' },
  { value: 'SOCIAL_CHARITY', label: 'Philanthropic Velocity', stream: 'Character' },
  { value: 'SOCIAL_CONNECTION', label: 'Family Presence', stream: 'Character' },
];

const VERIFICATION_METHODS = [
  { value: 'HEALTHKIT', label: 'HealthKit (iOS)' },
  { value: 'HEALTHCONNECT', label: 'Health Connect (Android)' },
  { value: 'SCREENTIME', label: 'Screen Time API' },
  { value: 'EXTERNAL_API', label: 'Third-Party API' },
  { value: 'FURY_NETWORK', label: 'Fury Peer Review' },
  { value: 'TIME_LAPSE_PROOF', label: 'Time-Lapse Proof' },
  { value: 'GPS', label: 'GPS Geofence' },
  { value: 'LEDGER', label: 'Financial Ledger' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
];

const STREAMS = Array.from(new Set(OATH_CATEGORIES.map((c) => c.stream)));

export function CreateContractScreen({ navigation }: Props) {
  const [selectedStream, setSelectedStream] = useState('');
  const [oathCategory, setOathCategory] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Health metrics (BIOLOGICAL_WEIGHT only)
  const [currentWeightLbs, setCurrentWeightLbs] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [targetWeightLbs, setTargetWeightLbs] = useState('');

  const isWeightCategory = oathCategory === 'BIOLOGICAL_WEIGHT';

  const streamCategories = selectedStream
    ? OATH_CATEGORIES.filter((c) => c.stream === selectedStream)
    : [];

  // Client-side Aegis preview for weight goals
  const aegisWarning = (() => {
    if (!isWeightCategory || !currentWeightLbs || !heightInches || !targetWeightLbs) return null;
    const weight = parseFloat(currentWeightLbs);
    const height = parseFloat(heightInches);
    const target = parseFloat(targetWeightLbs);
    if (!weight || !height || !target) return null;

    const targetBmi = (target / (height * height)) * 703;
    if (targetBmi < MIN_SAFE_BMI) {
      return `Target BMI ${targetBmi.toFixed(1)} is below the safe floor of ${MIN_SAFE_BMI}. This oath will be rejected.`;
    }

    const weeklyLoss = (weight - target) / (durationDays / 7);
    const weeklyPct = weeklyLoss / weight;
    if (weeklyPct > MAX_WEEKLY_LOSS_VELOCITY_PCT) {
      return `Weekly loss velocity ${(weeklyPct * 100).toFixed(1)}% exceeds the ${(MAX_WEEKLY_LOSS_VELOCITY_PCT * 100)}% safety cap. Choose a longer duration or smaller target.`;
    }
    return null;
  })();

  const handleSubmit = async () => {
    setError('');

    if (!oathCategory || !verificationMethod || !stakeAmount || !description) {
      setError('All fields are required.');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Stake amount must be a positive number.');
      return;
    }

    if (aegisWarning) {
      setError(aegisWarning);
      return;
    }

    setSubmitting(true);
    try {
      const result = await ApiClient.createContract({
        category: oathCategory,
        description,
        stakeAmount: amount,
        durationDays,
      });
      navigation.navigate('ContractDetail', { contractId: result.contractId });
    } catch (err: any) {
      setError(err.message || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Stream Picker */}
      <Text style={styles.label}>OATH STREAM</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {STREAMS.map((stream) => (
          <TouchableOpacity
            key={stream}
            style={[styles.chip, selectedStream === stream && styles.chipSelected]}
            onPress={() => {
              setSelectedStream(stream);
              setOathCategory('');
            }}
          >
            <Text style={[styles.chipText, selectedStream === stream && styles.chipTextSelected]}>
              {stream}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Picker */}
      {selectedStream ? (
        <>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {streamCategories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryChip, oathCategory === cat.value && styles.categoryChipSelected]}
                onPress={() => setOathCategory(cat.value)}
              >
                <Text style={[styles.categoryText, oathCategory === cat.value && styles.categoryTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {/* Verification Method */}
      <Text style={styles.label}>VERIFICATION METHOD</Text>
      <View style={styles.categoryGrid}>
        {VERIFICATION_METHODS.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[styles.categoryChip, verificationMethod === method.value && styles.categoryChipSelected]}
            onPress={() => setVerificationMethod(method.value)}
          >
            <Text style={[styles.categoryText, verificationMethod === method.value && styles.categoryTextSelected]}>
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>GOAL DESCRIPTION</Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your behavioral commitment..."
        placeholderTextColor="#555"
        multiline
        numberOfLines={3}
      />

      {/* Stake Amount */}
      <Text style={styles.label}>STAKE AMOUNT (USD)</Text>
      <View style={styles.inputRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={stakeAmount}
          onChangeText={setStakeAmount}
          placeholder="0.00"
          placeholderTextColor="#555"
          keyboardType="decimal-pad"
        />
      </View>
      <Text style={styles.hint}>Held in FBO escrow. Failure means forfeiture.</Text>

      {/* Duration */}
      <Text style={styles.label}>DURATION</Text>
      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.durationChip, durationDays === opt.value && styles.durationChipSelected]}
            onPress={() => setDurationDays(opt.value)}
          >
            <Text style={[styles.durationText, durationDays === opt.value && styles.durationTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Metrics (weight only) */}
      {isWeightCategory && (
        <View style={styles.healthSection}>
          <Text style={styles.label}>HEALTH METRICS</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthField}>
              <Text style={styles.healthLabel}>Current (lbs)</Text>
              <TextInput
                style={styles.healthInput}
                value={currentWeightLbs}
                onChangeText={setCurrentWeightLbs}
                keyboardType="decimal-pad"
                placeholderTextColor="#555"
                placeholder="180"
              />
            </View>
            <View style={styles.healthField}>
              <Text style={styles.healthLabel}>Height (in)</Text>
              <TextInput
                style={styles.healthInput}
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="decimal-pad"
                placeholderTextColor="#555"
                placeholder="70"
              />
            </View>
            <View style={styles.healthField}>
              <Text style={styles.healthLabel}>Target (lbs)</Text>
              <TextInput
                style={styles.healthInput}
                value={targetWeightLbs}
                onChangeText={setTargetWeightLbs}
                keyboardType="decimal-pad"
                placeholderTextColor="#555"
                placeholder="170"
              />
            </View>
          </View>
          {aegisWarning && <Text style={styles.aegisWarning}>{aegisWarning}</Text>}
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>STAKE AND COMMIT</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        By submitting, you authorize Styx to place an FBO hold on the specified amount.
        Funds are returned upon verified completion or forfeited upon failure.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  label: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, marginTop: 20 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  chipSelected: { backgroundColor: '#ff4444', borderColor: '#ff4444' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  categoryChipSelected: { backgroundColor: '#ff444430', borderColor: '#ff4444' },
  categoryText: { color: '#888', fontSize: 12, fontWeight: '500' },
  categoryTextSelected: { color: '#ff4444' },
  textArea: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { color: '#ff4444', fontSize: 24, fontWeight: '800', marginRight: 8 },
  amountInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 24,
    fontWeight: '800',
  },
  hint: { color: '#555', fontSize: 11, marginTop: 6 },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    alignItems: 'center',
  },
  durationChipSelected: { backgroundColor: '#ff4444', borderColor: '#ff4444' },
  durationText: { color: '#888', fontSize: 13, fontWeight: '700' },
  durationTextSelected: { color: '#fff' },
  healthSection: { marginTop: 4 },
  healthRow: { flexDirection: 'row', gap: 8 },
  healthField: { flex: 1 },
  healthLabel: { color: '#666', fontSize: 10, marginBottom: 4 },
  healthInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    padding: 10,
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  aegisWarning: { color: '#f39c12', fontSize: 12, marginTop: 8, lineHeight: 18 },
  submitButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  disclaimer: { color: '#444', fontSize: 11, textAlign: 'center', marginTop: 12, marginBottom: 40, lineHeight: 16 },
});
