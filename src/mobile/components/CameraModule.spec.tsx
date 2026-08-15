import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import { CameraModule } from './CameraModule';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';
import type { ProofProcessingStatus } from '../services/ApiClient';

jest.mock('../services/UploadService', () => ({
  UploadService: {
    requestPreSignedUrl: jest.fn(),
    uploadVideoBuffer: jest.fn(),
    confirmUpload: jest.fn(),
    pollProcessingStatus: jest.fn(),
  },
}));

jest.mock('../services/ApiClient', () => ({
  ApiClient: {
    submitProof: jest.fn(),
  },
}));

describe('CameraModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    mockPoll([{ proofId: 'proof_123', overallStatus: 'COMPLETED', jobs: [] }]);
  });

  /**
   * Replays a scripted sequence of pipeline readings through the component's
   * onUpdate callback, then resolves with the last one — the shape
   * UploadService.pollProcessingStatus has. Its own backoff/deadline logic is
   * covered in services/UploadService.spec.ts.
   */
  function mockPoll(readings: ProofProcessingStatus[]) {
    (UploadService.pollProcessingStatus as jest.Mock).mockImplementation(
      async (_proofId: string, onUpdate: (s: ProofProcessingStatus) => void) => {
        readings.forEach(onUpdate);
        return readings[readings.length - 1];
      },
    );
  }

  function submitCapture(contractId = 'contract-1') {
    const view = render(<CameraModule contractId={contractId} />);
    fireEvent.click(view.getByRole('button')); // start recording
    fireEvent.click(view.getByRole('button')); // stop recording
    fireEvent.click(view.getByText('SUBMIT TO FURY').closest('button') as HTMLElement);
    return view;
  }

  it('renders initial camera ready state', () => {
    const { container } = render(<CameraModule contractId="contract-1" />);
    expect(container.textContent).toContain('NON-PRODUCTION CAPTURE PREVIEW');
    expect(container.textContent).toContain('Camera Ready (Gallery Disabled)');
  });

  it('records, uploads, and submits proof to contracts endpoint', async () => {
    const { getByRole, getByText, container } = render(<CameraModule contractId="contract-1" />);

    fireEvent.click(getByRole('button')); // start recording
    expect(container.textContent).toContain('LIVE');
    expect(container.textContent).toContain('STYX//contract-1::');

    fireEvent.click(getByRole('button')); // stop recording
    expect(container.textContent).toContain('Exhaust Captured. Ready for Upload.');

    fireEvent.click(getByText('SUBMIT TO FURY').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(UploadService.requestPreSignedUrl).toHaveBeenCalledWith(
        'contract-1',
        'video/mp4',
        expect.stringContaining('capture-hash:'),
      );
      expect(UploadService.uploadVideoBuffer).toHaveBeenCalledWith(
        expect.stringContaining('data:video/mp4;base64,'),
        'https://r2.example.com/upload',
      );
      expect(UploadService.confirmUpload).toHaveBeenCalledWith(
        'proof_123',
        'proofs/proof_123/video.mp4',
      );
      expect(ApiClient.submitProof).toHaveBeenCalledWith('contract-1', {
        mediaUri: 'proofs/proof_123/video.mp4',
      });
      expect(UploadService.pollProcessingStatus).toHaveBeenCalledWith(
        'proof_123',
        expect.any(Function),
        expect.objectContaining({ isCancelled: expect.any(Function) }),
      );
    });
  });

  it('renders the pipeline stage while the proof is still processing', async () => {
    mockPoll([
      { proofId: 'proof_123', overallStatus: 'NOT_STARTED', jobs: [] },
      {
        proofId: 'proof_123',
        overallStatus: 'PROCESSING',
        jobs: [
          { stage: 'REDACT', status: 'IN_PROGRESS', error: null, updated_at: '2026-08-15T00:00:02Z' },
          { stage: 'TRANSCODE', status: 'COMPLETED', error: null, updated_at: '2026-08-15T00:00:01Z' },
        ],
      },
    ]);

    const { container } = submitCapture();

    await waitFor(() => {
      expect(container.textContent).toContain('PROOF PROCESSING');
      expect(container.textContent).toContain('Processing your proof...');
      // jobs[0] is the newest stage — the one the worker is on right now.
      expect(container.textContent).toContain('Stage: REDACT — IN_PROGRESS');
    });
  });

  it('renders the success state when the pipeline reports COMPLETED', async () => {
    const { container } = submitCapture();

    await waitFor(() => {
      expect(container.textContent).toContain('Processing Complete');
      expect(container.textContent).toContain('queued with the Fury Router');
    });
  });

  it('renders the failed stage error with a retry that re-polls', async () => {
    mockPoll([
      {
        proofId: 'proof_123',
        overallStatus: 'FAILED',
        jobs: [
          { stage: 'VALIDATE', status: 'FAILED', error: 'Source video is not decodable', updated_at: 'now' },
        ],
      },
    ]);

    const { container, getByText } = submitCapture();

    await waitFor(() => {
      expect(container.textContent).toContain('Processing Failed');
      expect(container.textContent).toContain('Source video is not decodable');
      expect(container.textContent).toContain('Failed at stage: VALIDATE');
    });

    fireEvent.click(getByText('RETRY').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(UploadService.pollProcessingStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('surfaces a poll that gave up at the deadline as a failure', async () => {
    (UploadService.pollProcessingStatus as jest.Mock).mockRejectedValue(
      new Error('Proof is still processing after 300s.'),
    );

    const { container } = submitCapture();

    await waitFor(() => {
      expect(container.textContent).toContain('Processing Failed');
      expect(container.textContent).toContain('Proof is still processing after 300s.');
    });
  });

  it('returns to the capture view when the processing view is dismissed', async () => {
    const { container, getByText } = submitCapture();

    await waitFor(() => expect(container.textContent).toContain('Processing Complete'));

    fireEvent.click(getByText('DONE').closest('button') as HTMLElement);

    expect(container.textContent).toContain('Camera Ready (Gallery Disabled)');
  });

  it('blocks submission when contract id is missing', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { getByRole, getByText } = render(<CameraModule />);

    fireEvent.click(getByRole('button')); // start
    fireEvent.click(getByRole('button')); // stop
    fireEvent.click(getByText('SUBMIT TO FURY').closest('button') as HTMLElement);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Upload Failed',
        'A contract ID is required to submit proof.',
      );
      expect(UploadService.requestPreSignedUrl).not.toHaveBeenCalled();
    });
  });
});
