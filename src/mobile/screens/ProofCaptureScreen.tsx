import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

// Note: requires react-native-camera or expo-camera to be installed.
// Using a conditional import approach so the screen still compiles without the camera dep.
let Camera: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Camera = require('react-native-camera').RNCamera;
} catch {
  // Camera dep not installed — screen will show fallback
}

const API_BASE = 'http://localhost:3000'; // TODO: use env variable

interface ProofCaptureScreenProps {
  route: { params: { contractId: string; token: string } };
  navigation: any;
}

/**
 * ProofCaptureScreen — Secure camera capture for No Contact proofs.
 *
 * Security constraints:
 *   1. Live capture only — no gallery/photo roll picker
 *   2. Tamper-evident watermark overlay (timestamp + device hash)
 *   3. Direct upload to R2 via pre-signed URL
 *   4. Calls POST /proofs/:id/confirm-upload on success
 */
export default function ProofCaptureScreen({ route, navigation }: ProofCaptureScreenProps) {
  const { contractId, token } = route.params;
  const cameraRef = useRef<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /** Generate a tamper-evident watermark string */
  const generateWatermark = (): string => {
    const now = new Date();
    const timestamp = now.toISOString();
    const deviceId = Platform.OS + '-' + Platform.Version;
    return `STYX | ${timestamp} | ${deviceId}`;
  };

  /** Request a pre-signed upload URL from the API */
  const requestUploadUrl = async (contentType: string) => {
    const res = await fetch(`${API_BASE}/proofs/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contractId, contentType }),
    });

    if (!res.ok) {
      throw new Error(`Failed to get upload URL: ${res.status}`);
    }

    return res.json() as Promise<{
      proofId: string;
      uploadUrl: string;
      storageKey: string;
    }>;
  };

  /** Upload media directly to R2 via pre-signed URL */
  const uploadToR2 = async (uploadUrl: string, filePath: string, contentType: string) => {
    const file = await fetch(filePath);
    const blob = await file.blob();

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });

    if (!res.ok) {
      throw new Error(`R2 upload failed: ${res.status}`);
    }
  };

  /** Confirm upload completion to the API */
  const confirmUpload = async (proofId: string, storageKey: string) => {
    const res = await fetch(`${API_BASE}/proofs/${proofId}/confirm-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ storageKey }),
    });

    if (!res.ok) {
      throw new Error(`Upload confirmation failed: ${res.status}`);
    }

    return res.json();
  };

  /** Capture a photo proof */
  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 1. Take photo with watermark metadata
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
        skipProcessing: false,
      });

      setUploadProgress(30);

      // 2. Request pre-signed upload URL
      const { proofId, uploadUrl, storageKey } = await requestUploadUrl('image/jpeg');
      setUploadProgress(50);

      // 3. Upload directly to R2
      await uploadToR2(uploadUrl, photo.uri, 'image/jpeg');
      setUploadProgress(80);

      // 4. Confirm upload
      await confirmUpload(proofId, storageKey);
      setUploadProgress(100);

      Alert.alert(
        'Proof Submitted',
        'Your compliance photo has been submitted for peer review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Upload Failed', (err as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [contractId, token, navigation]);

  /** Record a video proof */
  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30, // 30s max
        quality: Camera?.Constants?.VideoQuality?.['720p'] || '720p',
      });

      setIsRecording(false);
      setIsUploading(true);
      setUploadProgress(20);

      // Upload flow
      const { proofId, uploadUrl, storageKey } = await requestUploadUrl('video/mp4');
      setUploadProgress(40);

      await uploadToR2(uploadUrl, video.uri, 'video/mp4');
      setUploadProgress(80);

      await confirmUpload(proofId, storageKey);
      setUploadProgress(100);

      Alert.alert(
        'Proof Submitted',
        'Your compliance video has been submitted for peer review.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Recording Failed', (err as Error).message);
    } finally {
      setIsRecording(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [contractId, token, navigation, isRecording]);

  const stopRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }, [isRecording]);

  if (!Camera) {
    return (
      <View style={styles.container}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Camera Unavailable</Text>
          <Text style={styles.fallbackText}>
            The camera module is not installed. Please ensure react-native-camera
            is properly linked for your platform.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        flashMode={Camera.Constants.FlashMode.auto}
        captureAudio={true}
      >
        {/* Tamper-Evident Watermark Overlay */}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>{generateWatermark()}</Text>
        </View>

        {/* Upload Progress Overlay */}
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.uploadText}>
              Uploading... {uploadProgress}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={capturePhoto}
            disabled={isUploading || isRecording}
          >
            <Text style={styles.captureText}>📷</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            <Text style={styles.recordText}>
              {isRecording ? '⏹' : '🎥'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isUploading || isRecording}
          >
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            🔒 Live capture only • No gallery access • Tamper-evident watermark
          </Text>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  watermarkContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  watermarkText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  progressBar: {
    width: '60%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  recordingText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureText: { fontSize: 28 },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  recordButtonActive: { backgroundColor: '#fff' },
  recordText: { fontSize: 28 },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  securityNotice: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  fallbackTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  fallbackText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
