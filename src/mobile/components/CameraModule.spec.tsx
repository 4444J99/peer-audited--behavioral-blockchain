import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Alert, Platform } from 'react-native';
import { CameraModule } from './CameraModule';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';

const mockRequestNonce = jest.fn();
const mockIsCameraAvailable = jest.fn();
const mockCaptureVideo = jest.fn();
const mockGenerateSecureNonce = jest.fn();

jest.mock('../services/UploadService', () => ({
  UploadService: {
    requestPreSignedUrl: jest.fn(),
    uploadVideoBuffer: jest.fn(),
    confirmUpload: jest.fn(),
  },
}));

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    submitProof: jest.fn(),
  },
}));

jest.mock('../services/NativeCameraBridge', () => ({
  NativeCameraBridge: {
    requestNonce: (...args: any[]) => mockRequestNonce(...args),
    isCameraAvailable: (...args: any[]) => mockIsCameraAvailable(...args),
    captureVideo: (...args: any[]) => mockCaptureVideo(...args),
    generateSecureNonce: (...args: any[]) => mockGenerateSecureNonce(...args),
    capturePhoto: jest.fn(),
    applyWatermark: jest.fn(),
  },
}));

describe('CameraModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';

    (UploadService.requestPreSignedUrl as jest.Mock).mockResolvedValue({
      uploadUrl: 'https://r2.example.com/upload',
      proofId: 'proof_123',
      storageKey: 'proofs/proof_123/video.mp4',
    });
    (UploadService.uploadVideoBuffer as jest.Mock).mockResolvedValue(true);
    (UploadService.confirmUpload as jest.Mock).mockResolvedValue(true);
    (ApiClient.submitProof as jest.Mock).mockResolvedValue({
      proofId: 'proof_123',
      jobId: 'job_123',
    });

    mockIsCameraAvailable.mockResolvedValue({ available: false, authorized: false, notDetermined: false });
    mockRequestNonce.mockResolvedValue({
      nonce: 'STYX::abc123::1700000000000::contract-1',
      raw: 'abc123',
      expiresAt: 1700000120000,
    });
    mockCaptureVideo.mockResolvedValue({
      path: '/tmp/styx_capture_1700000000000_abc123.mp4',
      nonce: 'STYX::abc123::1700000000000::contract-1',
      durationMs: 5000,
      format: 'video/mp4',
    });
  });

  it('renders initial camera ready state with non-production banner when native unavailable', () => {
    const { container } = render(<CameraModule contractId="contract-1" />);
    expect(container.textContent).toContain('NON-PRODUCTION CAPTURE PREVIEW');
    expect(container.textContent).toContain('Camera Ready (Gallery Disabled)');
  });

  it('renders native camera banner when native is available', async () => {
    mockIsCameraAvailable.mockResolvedValue({ available: true, authorized: true, notDetermined: false });
    const { findByText } = render(<CameraModule contractId="contract-1" />);
    expect(await findByText('LIVE CAPTURE — NATIVE CAMERA')).toBeTruthy();
  });

  it('records synthetically when native camera is unavailable', async () => {
    const { getByRole, container } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button'));
    expect(mockRequestNonce).toHaveBeenCalledWith('contract-1');
    expect(container.textContent).toContain('LIVE');

    fireEvent.click(getByRole('button'));
    await waitFor(() => {
      expect(container.textContent).toContain('synthetic');
      expect(container.textContent).toContain('Exhaust Captured. Ready for Upload.');
    });
  });

  it('captures with native module when camera is available', async () => {
    mockIsCameraAvailable.mockResolvedValue({ available: true, authorized: true, notDetermined: false });
    mockCaptureVideo.mockResolvedValue({
      path: '/tmp/styx_capture.mp4',
      nonce: 'STYX::abc123::1700000000000::contract-1',
      durationMs: 3200,
      format: 'video/mp4',
    });

    const { getByRole, container } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button'));
    await waitFor(() => expect(container.textContent).toContain('LIVE'));

    fireEvent.click(getByRole('button'));
    await waitFor(() => {
      expect(mockCaptureVideo).toHaveBeenCalled();
      expect(container.textContent).toContain('Native');
      expect(container.textContent).toContain('Exhaust Captured. Ready for Upload.');
    });
  });

  it('uploads and submits proof via the full pipeline', async () => {
    mockIsCameraAvailable.mockResolvedValue({ available: true, authorized: true, notDetermined: false });
    mockCaptureVideo.mockResolvedValue({
      path: '/tmp/styx_capture.mp4',
      nonce: 'STYX::abc123::1700000000000::contract-1',
      durationMs: 5000,
      format: 'video/mp4',
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { getByRole, getByText } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));
    await waitFor(() => expect(getByText('SUBMIT TO FURY')).toBeTruthy());

    fireEvent.click(getByText('SUBMIT TO FURY').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(UploadService.requestPreSignedUrl).toHaveBeenCalledWith(
        'contract-1',
        'video/mp4',
        expect.stringContaining('nonce:'),
      );
      expect(UploadService.uploadVideoBuffer).toHaveBeenCalledWith(
        '/tmp/styx_capture.mp4',
        'https://r2.example.com/upload',
      );
      expect(UploadService.confirmUpload).toHaveBeenCalledWith(
        'proof_123',
        'proofs/proof_123/video.mp4',
      );
      expect(ApiClient.submitProof).toHaveBeenCalledWith('contract-1', {
        mediaUri: 'proofs/proof_123/video.mp4',
      });
      expect(alertSpy).toHaveBeenCalledWith(
        'Proof Secured',
        expect.stringContaining('capture has been sent to the Fury Router'),
      );
    });
  });

  it('blocks submission when contract id is missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { getByRole, getByText } = render(<CameraModule />);

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));
    await waitFor(() => expect(getByText('SUBMIT TO FURY')).toBeTruthy());
    fireEvent.click(getByText('SUBMIT TO FURY').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Upload Failed',
        'A contract ID is required to submit proof.',
      );
      expect(UploadService.requestPreSignedUrl).not.toHaveBeenCalled();
    });
  });

  it('shows error on native capture failure and allows retry', async () => {
    mockIsCameraAvailable.mockResolvedValue({ available: true, authorized: true, notDetermined: false });
    mockCaptureVideo.mockRejectedValue(new Error('Camera not ready'));

    const { getByRole, container } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));

    await waitFor(() => {
      expect(container.textContent).toContain('Capture failed: Camera not ready');
    });

    mockCaptureVideo.mockResolvedValue({
      path: '/tmp/styx_capture.mp4',
      nonce: 'STYX::abc123::1700000000000::contract-1',
      durationMs: 5000,
      format: 'video/mp4',
    });

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));
    await waitFor(() => {
      expect(container.textContent).toContain('Native');
    });
  });

  it('discards captured media without uploading', async () => {
    const { getByRole, getByText, container } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));
    await waitFor(() => expect(getByText('DISCARD')).toBeTruthy());

    fireEvent.click(getByText('DISCARD').closest('button') as HTMLElement);
    expect(container.textContent).toContain('Camera Ready (Gallery Disabled)');
    expect(UploadService.requestPreSignedUrl).not.toHaveBeenCalled();
  });
});
