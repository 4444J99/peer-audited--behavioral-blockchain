import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import { CameraModule } from './CameraModule';
import { UploadService } from '../services/UploadService';
import { ApiClient } from '../services/ApiClient';

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
  });

  it('renders initial camera ready state', () => {
    const { container } = render(<CameraModule contractId="contract-1" />);
    expect(container.textContent).toContain('Camera Ready (Gallery Disabled)');
  });

  it('records, uploads, and submits proof to contracts endpoint', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
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
      expect(alertSpy).toHaveBeenCalledWith(
        'Proof Secured',
        'Your recording has been sent to the Fury Router for anonymous validation.',
      );
    });
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
