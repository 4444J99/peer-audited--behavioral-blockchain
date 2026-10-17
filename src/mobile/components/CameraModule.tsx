import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';
import { NativeCameraBridge, CaptureResult } from '../services/NativeCameraBridge';
import { createCameraWatermark, createSyntheticCaptureSession } from '../utils/proof-media';

function tempFilePath(extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${Platform.select({ ios: '/tmp/', android: '/data/local/tmp/', default: '/tmp/' })}styx_capture_${timestamp}_${random}.${extension}`;
}

export const CameraModule = ({ contractId }: { contractId?: string }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [captureStartedAt, setCaptureStartedAt] = useState<number | null>(null);
  const [captureLabel, setCaptureLabel] = useState<string | null>(null);
  const [isNativeAvailable, setIsNativeAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nonceRef = useRef<string>('');
  const availabilityChecked = useRef(false);

  const checkNativeAvailability = useCallback(async (): Promise<boolean> => {
    if (availabilityChecked.current && isNativeAvailable !== null) {
      return isNativeAvailable;
    }
    try {
      const availability = await NativeCameraBridge.isCameraAvailable();
      const available = availability.available && availability.authorized;
      setIsNativeAvailable(available);
      availabilityChecked.current = true;
      return available;
    } catch {
      setIsNativeAvailable(false);
      availabilityChecked.current = true;
      return false;
    }
  }, [isNativeAvailable]);

  useEffect(() => {
    checkNativeAvailability();
  }, [checkNativeAvailability]);

  const startRecording = useCallback(async () => {
    setError(null);
    setCaptureResult(null);
    setCaptureLabel(null);
    setIsRecording(true);
    setCaptureStartedAt(Date.now());
    const newWatermark = createCameraWatermark(contractId);
    setWatermark(newWatermark);

    try {
      const nonceResult = await NativeCameraBridge.requestNonce(contractId || 'no-contract');
      nonceRef.current = nonceResult.nonce;
    } catch {
      nonceRef.current = newWatermark;
    }
  }, [contractId]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    const nativeAvailable = await checkNativeAvailability();

    if (nativeAvailable && Platform.OS === 'ios') {
      try {
        const outputPath = tempFilePath('mp4');
        const currentWatermark = watermark || createCameraWatermark(contractId);

        const result = await NativeCameraBridge.captureVideo(
          outputPath,
          nonceRef.current,
          currentWatermark,
          30000,
        );

        setCaptureResult(result);
        setCaptureLabel(
          `Native • ${result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : 'video'}`,
        );
      } catch (e: any) {
        setError(`Capture failed: ${e.message}`);
        setCaptureLabel(null);
      }
    } else {
      const session = createSyntheticCaptureSession(
        contractId,
        watermark,
        captureStartedAt,
        Date.now(),
      );
      setCaptureResult({
        path: session.mediaUri,
        nonce: nonceRef.current,
        format: 'data:video/mp4;base64',
        durationMs: session.durationMs,
      });
      setCaptureLabel(
        `${(session.durationMs / 1000).toFixed(1)}s synthetic • ${session.captureId}`,
      );
    }
  }, [contractId, watermark, captureStartedAt, checkNativeAvailability]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const submitProof = async () => {
    if (!captureResult || !contractId) {
      Alert.alert('Upload Failed', 'A contract ID is required to submit proof.');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, proofId, storageKey } = await UploadService.requestPreSignedUrl(
        contractId,
        'video/mp4',
        `Native camera submission | nonce:${nonceRef.current.slice(0, 20)}... | ${captureLabel || 'n/a'}`,
      );

      const transmissionSuccess = await UploadService.uploadVideoBuffer(captureResult.path, uploadUrl);
      if (!transmissionSuccess) {
        throw new Error('Video blob failed to transmit to Cloudflare R2.');
      }

      await UploadService.confirmUpload(proofId, storageKey);

      await ApiClient.submitProof(contractId, {
        mediaUri: storageKey,
      });

      Alert.alert(
        'Proof Secured',
        isNativeAvailable
          ? 'Your native camera capture has been sent to the Fury Router for validation.'
          : 'Your synthetic capture has been sent to the Fury Router for validation.',
      );
      discard();
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const discard = () => {
    setCaptureResult(null);
    setWatermark(null);
    setCaptureStartedAt(null);
    setCaptureLabel(null);
    setError(null);
    nonceRef.current = '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.betaBanner}>
        <Text style={styles.betaBannerText}>
          {isNativeAvailable ? 'LIVE CAPTURE — NATIVE CAMERA' : 'NON-PRODUCTION CAPTURE PREVIEW'}
        </Text>
      </View>

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
        ) : captureResult ? (
          <Text style={styles.viewfinderText}>Exhaust Captured. Ready for Upload.</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.viewfinderText}>Camera Ready (Gallery Disabled)</Text>
        )}
      </View>

      <View style={styles.controls}>
        {isUploading ? (
          <View style={styles.uploadingState}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.uploadingText}>Transmitting to R2...</Text>
          </View>
        ) : (
          <>
            {!captureResult ? (
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordingButton]}
                onPress={toggleRecording}
              >
                <View style={isRecording ? styles.squareIcon : styles.circleIcon} />
              </TouchableOpacity>
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.discardButton} onPress={discard}>
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
  errorText: { color: '#FF3B30', fontSize: 14, marginHorizontal: 20, textAlign: 'center' },
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
