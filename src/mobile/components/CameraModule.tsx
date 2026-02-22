import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { UploadService } from '../services/UploadService';

/**
 * The Styx Camera Module.
 * ARCHITECTURE RULE: ZERO TRUST.
 * This component intentionally omits any integration with `expo-image-picker` or the device gallery.
 * The ONLY way a user can submit a proof is by pressing the live record button through this view.
 */
export const CameraModule = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording mock
      setIsRecording(false);
      const mockCachedVideoUri = 'file:///data/user/0/com.styx.mobile/cache/live_proof_123.mp4';
      setVideoUri(mockCachedVideoUri);
      console.log('CameraModule: Recording stopped permanently at', mockCachedVideoUri);
    } else {
      // Start recording mock
      setVideoUri(null);
      setIsRecording(true);
      console.log('CameraModule: Live Hardware Recording Started.');
    }
  };

  const submitProof = async () => {
    if (!videoUri) return;

    setIsUploading(true);
    try {
      // Step 1: Secure Upload URL
      const { uploadUrl, proofId } = await UploadService.requestPreSignedUrl('video/mp4');

      // Step 2: Binary Transmission
      const transmissionSuccess = await UploadService.uploadVideoBuffer(videoUri, uploadUrl);

      if (!transmissionSuccess) {
        throw new Error('Video blob failed to transmit to Cloudflare R2.');
      }

      // Step 3: API Dispatch
      await UploadService.confirmUploadDispatch(proofId);

      Alert.alert('Proof Secured', 'Your recording has been sent to the Fury Router for anonymous validation.');
      setVideoUri(null); // Clear buffer
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mock Camera Viewfinder */}
      <View style={styles.viewfinder}>
        {isRecording ? (
          <View style={styles.recordingIndicator}>
            <View style={styles.redDot} />
            <Text style={styles.recordingText}>LIVE</Text>
          </View>
        ) : (
          <Text style={styles.viewfinderText}>
            {videoUri ? 'Video Captured. Ready for Upload.' : 'Camera Ready (Gallery Disabled)'}
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
                <TouchableOpacity style={styles.discardButton} onPress={() => setVideoUri(null)}>
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
});
