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
import { MAX_WEEKLY_LOSS_VELOCITY_PCT } from '@styx/shared/libs/behavioral-logic';
import { getMobileFeatureFlags } from '../config/beta';
import { SupportTraceErrorBanner } from '../components/SupportTraceErrorBanner';

type Props = NativeStackScreenProps<ContractsStackParamList, 'CreateContract'>;

const OATH_CATEGORIES = [
  { value: 'RECOVERY_NOCONTACT', label: 'No Contact Boundary', stream: 'Recovery' },
  { value: 'RECOVERY_SUBSTANCE', label: 'Substance Abstinence', stream: 'Recovery' },
  { value: 'RECOVERY_DETOX', label: 'Behavioral Detox', stream: 'Recovery' },
  { value: 'BIOLOGICAL_WEIGHT', label: 'Weight Management', stream: 'Biological' },
  { value: 'BIOLOGICAL_CARDIO', label: 'Cardiovascular Stamina', stream: 'Biological' },
  { value: 'COGNITIVE_DIGITAL', label: 'Digital Fasting', stream: 'Cognitive' },
  { value: 'COGNITIVE_FOCUS', label: 'Deep Work Focus', stream: 'Cognitive' },
  { value: 'PROFESSIONAL_SALES', label: 'Sales Velocity', stream: 'Professional' },
  { value: 'PROFESSIONAL_CODE', label: 'Developer Throughput', stream: 'Professional' },
  { value: 'CREATIVE_WRITING', label: 'Deep Writing', stream: 'Creative' },
  { value: 'CREATIVE_BUILD', label: 'Maker Build', stream: 'Creative' },
];

const VERIFICATION_METHODS = [
  { value: 'ATTESTATION', label: 'Daily Check-In' },
  { value: 'FURY_NETWORK', label: 'Fury Peer Review' },
  { value: 'SCREENTIME', label: 'Screen Time API' },
  { value: 'HEALTHKIT', label: 'Apple HealthKit' },
  { value: 'GPS', label: 'GPS Geofence' },
];

const DURATION_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '90d' },
];

const MIN_STAKE_USD = 10;
const MAX_STAKE_USD = 200;
const STAKE_PRESETS = [
  { value: 20, label: '$20 Light' },
  { value: 50, label: '$50 Default' },
  { value: 100, label: '$100 Serious' },
];

export function CreateContractScreen({ navigation }: Props) {
  const featureFlags = getMobileFeatureFlags();
  const visibleCategories = featureFlags.phase1NoContactOnly
    ? OATH_CATEGORIES.filter((c) => c.value.startsWith('RECOVERY_'))
    : OATH_CATEGORIES;
  const streams = Array.from(new Set(visibleCategories.map((c) => c.stream)));
  const [selectedStream, setSelectedStream] = useState('');
  const [oathCategory, setOathCategory] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [targetIdentifiers, setTargetIdentifiers] = useState(['']);
  const [acks, setAcks] = useState({
    voluntary: false,
    noMinors: false,
    noDependents: false,
    noLegalObligations: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const streamCategories = selectedStream
    ? visibleCategories.filter((c) => c.stream === selectedStream)
    : [];
  const parsedStake = Number.parseFloat(stakeAmount);
  const hasStake = Number.isFinite(parsedStake) && parsedStake > 0;
  const normalizedStake = hasStake ? parsedStake : 0;
  const boundedStake = Math.min(MAX_STAKE_USD, Math.max(MIN_STAKE_USD, normalizedStake));
  const perDayExposure = boundedStake / Math.max(durationDays, 1);
  const weeklyLossCap = boundedStake * MAX_WEEKLY_LOSS_VELOCITY_PCT;

  const handleSubmit = async () => {
    setError('');

    if (!oathCategory || !verificationMethod || !stakeAmount || !description) {
      setError('All fields are required.');
      return;
    }

    const isRecovery = oathCategory.startsWith('RECOVERY_');
    if (isRecovery) {
      if (!partnerEmail) {
        setError('Accountability partner email is required for recovery contracts.');
        return;
      }
      if (!acks.voluntary || !acks.noMinors || !acks.noDependents || !acks.noLegalObligations) {
        setError('All safety acknowledgments must be confirmed.');
        return;
      }
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Stake amount must be a positive number.');
      return;
    }
    if (amount < MIN_STAKE_USD || amount > MAX_STAKE_USD) {
      setError(`Stake amount must be between $${MIN_STAKE_USD} and $${MAX_STAKE_USD}.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await ApiClient.createContract({
        oathCategory,
        verificationMethod,
        description,
        stakeAmount: Number(amount.toFixed(2)),
        durationDays,
        recoveryMetadata: isRecovery
          ? {
              accountabilityPartnerEmail: partnerEmail,
              noContactIdentifiers: targetIdentifiers.filter((id) => id.trim() !== ''),
              acknowledgments: acks,
            }
          : undefined,
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
      <SupportTraceErrorBanner
        value={error}
        messageStyle={styles.error}
        traceStyle={styles.errorTrace}
      />

      {/* Stream Picker */}
      <View style={styles.betaNotice}>
        <Text style={styles.betaNoticeText}>
          {featureFlags.testMoneyMode
            ? 'Private beta • test-money pilot'
            : 'Private beta pilot'}
        </Text>
        {featureFlags.phase1NoContactOnly ? (
          <Text style={styles.betaNoticeSubtext}>
            Phase 1: No-Contact recovery contract flows are prioritized. Additional oath categories are hidden during beta hardening.
          </Text>
        ) : null}
      </View>

      {/* Stream Picker */}
      <Text style={styles.label}>OATH STREAM</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {streams.map((stream) => (
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

      {/* Recovery Sections */}
      {oathCategory.startsWith('RECOVERY_') ? (
        <>
          <Text style={styles.label}>ACCOUNTABILITY PARTNER EMAIL</Text>
          <TextInput
            style={styles.textInput}
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            placeholder="partner@example.com"
            placeholderTextColor="#555"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {oathCategory === 'RECOVERY_NOCONTACT' ? (
            <>
              <Text style={styles.label}>NO-CONTACT TARGETS (NAME/LABEL)</Text>
              <Text style={styles.hint}>List up to 3 people/entities you are avoiding. These will be hashed before storage.</Text>
              {targetIdentifiers.map((val, idx) => (
                <View key={idx} style={styles.identifierRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={val}
                    onChangeText={(text) => {
                      const newIds = [...targetIdentifiers];
                      newIds[idx] = text;
                      setTargetIdentifiers(newIds);
                    }}
                    placeholder={`Target #${idx + 1}`}
                    placeholderTextColor="#555"
                  />
                  {targetIdentifiers.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setTargetIdentifiers(targetIdentifiers.filter((_, i) => i !== idx))}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {targetIdentifiers.length < 3 && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setTargetIdentifiers([...targetIdentifiers, ''])}
                >
                  <Text style={styles.addButtonText}>+ ADD TARGET</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}

          <Text style={styles.label}>SAFETY ACKNOWLEDGMENTS</Text>
          {[
            { key: 'voluntary', label: 'I am entering this contract voluntarily.' },
            { key: 'noMinors', label: 'No minors are involved in this contract.' },
            { key: 'noDependents', label: 'No dependents are affected by this commitment.' },
            { key: 'noLegalObligations', label: 'This does not violate any legal obligations.' },
          ].map((ack) => (
            <TouchableOpacity
              key={ack.key}
              style={styles.ackRow}
              onPress={() => setAcks({ ...acks, [ack.key]: !acks[ack.key as keyof typeof acks] })}
            >
              <View style={[styles.checkbox, acks[ack.key as keyof typeof acks] && styles.checkboxSelected]}>
                {acks[ack.key as keyof typeof acks] && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.ackLabel}>{ack.label}</Text>
            </TouchableOpacity>
          ))}
        </>
      ) : null}

      {/* Stake Amount */}
      <Text style={styles.label}>STAKE AMOUNT (USD)</Text>
      <View style={styles.presetRow}>
        {STAKE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[
              styles.presetChip,
              Number(stakeAmount || 0) === preset.value && styles.presetChipSelected,
            ]}
            onPress={() => setStakeAmount(preset.value.toFixed(2))}
          >
            <Text
              style={[
                styles.presetText,
                Number(stakeAmount || 0) === preset.value && styles.presetTextSelected,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
      <Text style={styles.hint}>
        Bounded range: ${MIN_STAKE_USD} to ${MAX_STAKE_USD}. Choose a commitment that is meaningful but sustainable.
      </Text>
      <Text style={styles.hint}>
        {featureFlags.testMoneyMode
          ? 'Test-money pilot: no real-money movement occurs in this beta environment.'
          : 'Held in FBO escrow. Failure means forfeiture.'}
      </Text>
      {hasStake ? (
        <View style={styles.lossPanel}>
          <Text style={styles.lossTitle}>Loss Math Preview</Text>
          <Text style={styles.lossLine}>Vault hold: ${boundedStake.toFixed(2)}</Text>
          <Text style={styles.lossLine}>Per-day exposure ({durationDays}d): ${perDayExposure.toFixed(2)}</Text>
          <Text style={styles.lossLine}>
            Weekly loss cap policy ({Math.round(MAX_WEEKLY_LOSS_VELOCITY_PCT * 100)}%): ${weeklyLossCap.toFixed(2)}
          </Text>
        </View>
      ) : null}

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
        {featureFlags.testMoneyMode
          ? 'Beta pilot only: stake amounts are simulated for product validation. KYC and production settlement controls are not enabled in this environment.'
          : 'By submitting, you authorize Styx to place an FBO hold on the specified amount. Funds are returned upon verified completion or forfeited upon failure.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  error: { color: '#ff6666', backgroundColor: '#ff444420', padding: 10, borderRadius: 8, marginBottom: 12 },
  errorTrace: { color: '#888', fontSize: 11, marginTop: -8, marginBottom: 12, paddingHorizontal: 4 },
  betaNotice: {
    backgroundColor: '#20150d',
    borderWidth: 1,
    borderColor: '#4a2a16',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  betaNoticeText: { color: '#ffb26b', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  betaNoticeSubtext: { color: '#d9b793', fontSize: 11, marginTop: 4, lineHeight: 16 },
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
  textInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 14,
    color: '#e0e0e0',
    fontSize: 14,
  },
  identifierRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  removeButton: {
    backgroundColor: '#1a1a2e',
    width: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff444430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: { color: '#ff4444', fontSize: 18 },
  addButton: {
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: { color: '#ff4444', fontSize: 11, fontWeight: '800' },
  ackRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { borderColor: '#ff4444', backgroundColor: '#ff444420' },
  checkMark: { color: '#ff4444', fontWeight: 'bold' },
  ackLabel: { color: '#9a9ab3', fontSize: 13, flex: 1 },
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
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    backgroundColor: '#151523',
  },
  presetChipSelected: {
    borderColor: '#ff4444',
    backgroundColor: '#ff444420',
  },
  presetText: { color: '#9b9bb5', fontSize: 12, fontWeight: '700' },
  presetTextSelected: { color: '#ff6666' },
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
  lossPanel: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#12121c',
  },
  lossTitle: { color: '#d6d6ea', fontSize: 11, fontWeight: '800', marginBottom: 6, letterSpacing: 0.3 },
  lossLine: { color: '#9a9ab3', fontSize: 11, lineHeight: 16 },
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
