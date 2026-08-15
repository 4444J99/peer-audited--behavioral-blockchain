import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';
import type { ProofProcessingStatus } from '../services/ApiClient';
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

  // Backend pipeline state, deliberately separate from isUploading: that flag
  // tracks the raw R2 PUT, which is already finished when any of this begins.
  const [processingProofId, setProcessingProofId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProofProcessingStatus | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // A poll outlives the render that started it, so it needs a channel the running
  // loop can read: refs, not state. The generation counter orphans a superseded
  // poll (dismiss, or a retry started while the previous round is mid-sleep) —
  // a single boolean cannot, because clearing it to re-arm would also un-cancel
  // the loop it was meant to stop.
  const unmountedRef = useRef(false);
  const pollGenerationRef = useRef(0);
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const watchProcessing = async (proofId: string) => {
    const generation = ++pollGenerationRef.current;
    const isStale = () => unmountedRef.current || pollGenerationRef.current !== generation;

    setProcessingProofId(proofId);
    setProcessingStatus(null);
    setProcessingError(null);
    setIsPolling(true);
    try {
      await UploadService.pollProcessingStatus(
        proofId,
        (status) => {
          if (!isStale()) {
            setProcessingStatus(status);
          }
        },
        { isCancelled: isStale },
      );
    } catch (error: any) {
      if (!isStale()) {
        setProcessingError(error.message);
      }
    } finally {
      if (!isStale()) {
        setIsPolling(false);
      }
    }
  };

  const dismissProcessing = () => {
    pollGenerationRef.current += 1;
    setProcessingProofId(null);
    setProcessingStatus(null);
    setProcessingError(null);
    setIsPolling(false);
  };

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
      const { uploadUrl, proofId, storageKey, captureNonce } = await UploadService.requestPreSignedUrl(
        contractId,
        'video/mp4',
        `Live camera submission | capture-hash:${captureHash || 'none'} | ${captureLabel || 'n/a'}`,
      );

      const transmissionSuccess = await UploadService.uploadVideoBuffer(videoUri, uploadUrl);
      if (!transmissionSuccess) {
        throw new Error('Video blob failed to transmit to Cloudflare R2.');
      }

      // This build's capture path is synthetic (createSyntheticCaptureSession),
      // and it declares that rather than letting the server guess. The nonce is
      // echoed regardless so the plumbing is exercised on the path that exists
      // today, not only on the native one that arrives with #141.
      const dispatchSuccess = await UploadService.confirmUpload(
        proofId,
        storageKey,
        'SYNTHETIC_BETA',
        captureNonce,
      );
      if (!dispatchSuccess) {
        throw new Error('Proof upload confirmed failed during queue dispatch.');
      }

      await ApiClient.submitProof(contractId, {
        mediaUri: storageKey,
      });

      setVideoUri(null);
      setCaptureHash(null);
      setWatermark(null);
      setCaptureStartedAt(null);
      setCaptureLabel(null);
      setIsUploading(false);
      // The upload is only half the story: transcode/redact runs on a worker and
      // the proof is not reviewable until it lands. Hold the user on a live
      // processing view instead of the old terminal "secured" alert, which
      // claimed completion the pipeline had not reached.
      await watchProcessing(proofId);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (processingProofId) {
    // The API orders proof_processing_jobs newest-first, so jobs[0] is the stage
    // the worker is on right now.
    const latestJob = processingStatus?.jobs?.[0] || null;
    const failedJob = processingStatus?.jobs?.find((job) => job.status === 'FAILED') || null;
    const overallStatus = processingStatus?.overallStatus || 'NOT_STARTED';
    const hasFailed = overallStatus === 'FAILED' || processingError !== null;
    const hasCompleted = overallStatus === 'COMPLETED' && !processingError;

    return (
      <View style={styles.container}>
        <View style={styles.betaBanner}>
          <Text style={styles.betaBannerText}>PROOF PROCESSING</Text>
        </View>

        <View style={styles.processingPanel}>
          {hasFailed ? (
            <>
              <Text style={styles.processingFailedTitle}>Processing Failed</Text>
              <Text style={styles.processingDetail}>
                {processingError ||
                  failedJob?.error ||
                  'The processing pipeline could not finish this proof.'}
              </Text>
              {failedJob ? (
                <Text style={styles.processingStage}>Failed at stage: {failedJob.stage}</Text>
              ) : null}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={dismissProcessing}
                >
                  <Text style={styles.discardText}>RECORD ANOTHER</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => watchProcessing(processingProofId)}
                >
                  <Text style={styles.submitText}>RETRY</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : hasCompleted ? (
            <>
              <Text style={styles.processingDoneTitle}>Processing Complete</Text>
              <Text style={styles.processingDetail}>
                Your proof is redacted and queued with the Fury Router for validation.
              </Text>
              <TouchableOpacity style={styles.submitButton} onPress={dismissProcessing}>
                <Text style={styles.submitText}>DONE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isPolling ? <ActivityIndicator size="large" color="#FF3B30" /> : null}
              <Text style={styles.processingTitle}>
                {overallStatus === 'NOT_STARTED'
                  ? 'Waiting for the processing worker...'
                  : 'Processing your proof...'}
              </Text>
              <Text style={styles.processingStage}>
                {latestJob
                  ? `Stage: ${latestJob.stage} — ${latestJob.status}`
                  : 'No pipeline stage reported yet.'}
              </Text>
              <Text style={styles.processingDetail}>
                Transcoding and identity redaction run on a background worker. You can leave this
                screen; processing continues either way.
              </Text>
              <TouchableOpacity style={styles.discardButton} onPress={dismissProcessing}>
                <Text style={styles.discardText}>RUN IN BACKGROUND</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

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
  processingPanel: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  processingTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  processingDoneTitle: { color: '#34C759', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  processingFailedTitle: { color: '#FF3B30', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  processingStage: { color: '#FFB26B', fontFamily: 'monospace', fontSize: 12, marginTop: 12, textAlign: 'center' },
  processingDetail: { color: '#888', fontSize: 13, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  betaBannerText: { color: '#ffb26b', fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
});
