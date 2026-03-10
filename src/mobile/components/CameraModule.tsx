import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';
import { createCameraWatermark, createSyntheticCaptureSession } from '../utils/proof-media';

/**
 * The Styx Camera Module.
 * ARCHITECTURE RULE: ZERO TRUST.
 * This component intentionally omits any integration with `expo-image-picker` or the device gallery.
 * The ONLY way a user can submit a proof is by pressing the live record button through this view.
 */
export const CameraModule = ({ contractId }: { contractId?: string }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [captureHash, setCaptureHash] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [captureStartedAt, setCaptureStartedAt] = useState<number | null>(null);
  const [captureLabel, setCaptureLabel] = useState<string | null>(null);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      const captureSession = createSyntheticCaptureSession(
        contractId,
        watermark,
        captureStartedAt,
        Date.now(),
      );
      setVideoUri(captureSession.mediaUri);
      setCaptureHash(captureSession.captureHash);
      setCaptureLabel(
        `${(captureSession.durationMs / 1000).toFixed(1)}s capture • ${captureSession.captureId}`,
      );
    } else {
      setVideoUri(null);
      setCaptureHash(null);
      setCaptureLabel(null);
      setIsRecording(true);
      setCaptureStartedAt(Date.now());
      setWatermark(createCameraWatermark(contractId));
    }
  };

  const submitProof = async () => {
    if (!videoUri || !contractId) {
      Alert.alert('Upload Failed', 'A contract ID is required to submit proof.');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, proofId, storageKey } = await UploadService.requestPreSignedUrl(
        contractId,
        'video/mp4',
        `Live camera submission | capture-hash:${captureHash || 'none'} | ${captureLabel || 'n/a'}`,
      );

      const transmissionSuccess = await UploadService.uploadVideoBuffer(videoUri, uploadUrl);
      if (!transmissionSuccess) {
        throw new Error('Video blob failed to transmit to Cloudflare R2.');
      }

      const dispatchSuccess = await UploadService.confirmUpload(proofId, storageKey);
      if (!dispatchSuccess) {
        throw new Error('Proof upload confirmed failed during queue dispatch.');
      }

      await ApiClient.submitProof(contractId, {
        mediaUri: storageKey,
      });

      Alert.alert(
        'Beta Proof Secured',
        'Your recording has been sent to the Fury Router for validation. NOTE: This is a synthetic capture path for the Phase 1 Beta pilot.',
      );
      setVideoUri(null);
      setCaptureHash(null);
      setWatermark(null);
      setCaptureStartedAt(null);
      setCaptureLabel(null);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Beta Preview Banner */}
      <View style={styles.betaBanner}>
        <Text style={styles.betaBannerText}>
          NON-PRODUCTION CAPTURE PREVIEW
        </Text>
      </View>

      {/* Mock Camera Viewfinder */}
      <View style={styles.viewfinder}>
        {isRecording ? (
          <>
            <View style={styles.recordingIndicator}>
              <View style={styles.redDot} />
              <Text style={styles.recordingText}>LIVE</Text>
            </View>
            <View style={styles.watermarkOverlay}>
              <Text style={styles.watermarkText}>{watermark}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.viewfinderText}>
            {videoUri ? 'Exhaust Captured. Ready for Upload.' : 'Camera Ready (Gallery Disabled)'}
          </Text>
        )}
      </View>

      {/* Controls Container */}
      <View style={styles.controls}>
        {isUploading ? (
          <View style={styles.uploadingState}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.uploadingText}>Transmitting to R2...</Text>
          </View>
        ) : (
          <>
            {!videoUri ? (
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordingButton]}
                onPress={toggleRecording}
              >
                <View style={isRecording ? styles.squareIcon : styles.circleIcon} />
              </TouchableOpacity>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => {
                    setVideoUri(null);
                    setCaptureHash(null);
                    setWatermark(null);
                    setCaptureStartedAt(null);
                    setCaptureLabel(null);
                  }}
                >
                  <Text style={styles.discardText}>DISCARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={submitProof}>
                  <Text style={styles.submitText}>SUBMIT TO FURY</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      {captureLabel ? (
        <View style={styles.captureMeta}>
          <Text style={styles.captureMetaText}>{captureLabel}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'column' },
  viewfinder: { flex: 4, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  viewfinderText: { color: '#666', fontSize: 16 },
  recordingIndicator: { position: 'absolute', top: 40, right: 30, flexDirection: 'row', alignItems: 'center' },
  redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', marginRight: 8 },
  recordingText: { color: '#FF3B30', fontWeight: 'bold' },
  controls: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  recordButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  recordingButton: { borderColor: '#FF3B30' },
  circleIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FF3B30' },
  squareIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: '#FF3B30' },
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingHorizontal: 20 },
  discardButton: { padding: 20 },
  discardText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#FFF', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 30 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '900' },
  uploadingState: { alignItems: 'center' },
  uploadingText: { color: '#FFF', marginTop: 16, fontWeight: 'bold' },
  watermarkOverlay: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#fff' },
  watermarkText: { color: '#FFF', fontFamily: 'monospace', fontSize: 10, textAlign: 'center' },
  captureMeta: { alignItems: 'center', paddingBottom: 10 },
  captureMetaText: { color: '#888', fontSize: 12 },
  betaBanner: { backgroundColor: '#20150d', padding: 8, borderBottomWidth: 1, borderBottomColor: '#4a2a16' },
  betaBannerText: { color: '#ffb26b', fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
});
