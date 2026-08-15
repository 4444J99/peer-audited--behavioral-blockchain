import {
  UploadService,
  PROCESSING_POLL_INITIAL_MS,
  PROCESSING_POLL_MAX_MS,
  PROCESSING_POLL_DEADLINE_MS,
} from './UploadService';
import { ApiClient } from './ApiClient';
import type { ProofProcessingStatus } from './ApiClient';

jest.mock('./SessionService', () => ({
  SessionService: {
    getToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  },
}));

jest.mock('./ApiClient', () => ({
  ApiClient: {
    getProcessingStatus: jest.fn(),
  },
}));

function status(
  overallStatus: string,
  jobs: ProofProcessingStatus['jobs'] = [],
): ProofProcessingStatus {
  return { proofId: 'proof_123', overallStatus, jobs };
}

/**
 * Drives the poll without real timers: `sleep` advances a virtual clock that
 * `now` reads, so a 5-minute deadline resolves in microseconds and every
 * recorded delay is exactly what the backoff asked for.
 */
function createVirtualClock() {
  let current = 0;
  const slept: number[] = [];
  return {
    slept,
    now: () => current,
    sleep: async (ms: number) => {
      slept.push(ms);
      current += ms;
    },
  };
}

const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  (ApiClient.getProcessingStatus as jest.Mock).mockReset();
});

describe('UploadService', () => {
  it('requestPreSignedUrl() calls API and returns uploadUrl, proofId, and storageKey', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: 'https://r2.example.com/upload?sig=abc',
        proofId: 'proof_123',
        storageKey: 'proofs/proof_123/video.mp4',
      }),
    });

    const result = await UploadService.requestPreSignedUrl(
      'contract_123',
      'video/mp4',
      'Camera capture from mobile',
    );

    expect(result).toEqual({
      uploadUrl: 'https://r2.example.com/upload?sig=abc',
      proofId: 'proof_123',
      storageKey: 'proofs/proof_123/video.mp4',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/proofs/upload-url'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }),
        body: JSON.stringify({
          contractId: 'contract_123',
          contentType: 'video/mp4',
          description: 'Camera capture from mobile',
        }),
      }),
    );
  });

  it('requestPreSignedUrl() throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(UploadService.requestPreSignedUrl('contract_123', 'video/mp4'))
      .rejects.toThrow('Failed to request pre-signed URL: 401');
  });

  it('uploadVideoBuffer() fetches local file and PUTs to presigned URL', async () => {
    const mockBlob = new Blob(['video-data']);
    // First fetch: read local file
    mockFetch.mockResolvedValueOnce({
      blob: async () => mockBlob,
    });
    // Second fetch: PUT to presigned URL
    mockFetch.mockResolvedValueOnce({ ok: true });

    const ok = await UploadService.uploadVideoBuffer(
      'file:///local/video.mp4',
      'https://r2.example.com/upload?sig=abc',
    );

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'file:///local/video.mp4');
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://r2.example.com/upload?sig=abc',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('uploadVideoBuffer() returns false on upload failure', async () => {
    const mockBlob = new Blob(['video-data']);
    mockFetch.mockResolvedValueOnce({ blob: async () => mockBlob });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const ok = await UploadService.uploadVideoBuffer(
      'file:///local/video.mp4',
      'https://r2.example.com/upload?sig=abc',
    );

    expect(ok).toBe(false);
  });

  it('confirmUpload() calls confirmation endpoint and returns true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const ok = await UploadService.confirmUpload('proof_123', 'proofs/proof_123/video.mp4');

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/proofs/proof_123/confirm-upload'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }),
        body: JSON.stringify({ storageKey: 'proofs/proof_123/video.mp4' }),
      }),
    );
  });

  it('confirmUpload() returns false on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const ok = await UploadService.confirmUpload('proof_123', 'proofs/proof_123/video.mp4');

    expect(ok).toBe(false);
  });

  it('getProcessingStatus() rehydrates the session token and delegates to ApiClient', async () => {
    (ApiClient.getProcessingStatus as jest.Mock).mockResolvedValueOnce(status('PROCESSING'));

    const result = await UploadService.getProcessingStatus('proof_123');

    expect(result).toEqual(status('PROCESSING'));
    expect(ApiClient.getProcessingStatus).toHaveBeenCalledWith('proof_123');
  });
});

describe('UploadService.pollProcessingStatus()', () => {
  it('reports every reading and resolves on COMPLETED', async () => {
    const clock = createVirtualClock();
    (ApiClient.getProcessingStatus as jest.Mock)
      .mockResolvedValueOnce(status('NOT_STARTED'))
      .mockResolvedValueOnce(
        status('PROCESSING', [
          { stage: 'TRANSCODE', status: 'IN_PROGRESS', error: null, updated_at: 't1' },
        ]),
      )
      .mockResolvedValueOnce(status('COMPLETED'));

    const seen: string[] = [];
    const final = await UploadService.pollProcessingStatus(
      'proof_123',
      (s) => seen.push(s.overallStatus),
      { now: clock.now, sleep: clock.sleep },
    );

    expect(seen).toEqual(['NOT_STARTED', 'PROCESSING', 'COMPLETED']);
    expect(final?.overallStatus).toBe('COMPLETED');
    expect(ApiClient.getProcessingStatus).toHaveBeenCalledTimes(3);
  });

  it('stops on FAILED without polling again', async () => {
    const clock = createVirtualClock();
    (ApiClient.getProcessingStatus as jest.Mock).mockResolvedValueOnce(
      status('FAILED', [
        { stage: 'VALIDATE', status: 'FAILED', error: 'Source video is not decodable', updated_at: 't1' },
      ]),
    );

    const final = await UploadService.pollProcessingStatus('proof_123', () => {}, {
      now: clock.now,
      sleep: clock.sleep,
    });

    expect(final?.overallStatus).toBe('FAILED');
    expect(ApiClient.getProcessingStatus).toHaveBeenCalledTimes(1);
    expect(clock.slept).toEqual([]);
  });

  it('backs off exponentially from 2s and caps at 30s', async () => {
    const clock = createVirtualClock();
    (ApiClient.getProcessingStatus as jest.Mock).mockResolvedValue(status('PROCESSING'));

    await expect(
      UploadService.pollProcessingStatus('proof_123', () => {}, {
        now: clock.now,
        sleep: clock.sleep,
      }),
    ).rejects.toThrow('Proof is still processing after 300s.');

    expect(clock.slept.slice(0, 5)).toEqual([2_000, 4_000, 8_000, 16_000, 30_000]);
    expect(Math.max(...clock.slept)).toBe(PROCESSING_POLL_MAX_MS);
    expect(clock.slept[0]).toBe(PROCESSING_POLL_INITIAL_MS);
    // Each sleep is clamped to the time left, so the loop lands exactly on the
    // deadline instead of overshooting it by up to a full backoff interval.
    expect(clock.slept.reduce((a, b) => a + b, 0)).toBe(PROCESSING_POLL_DEADLINE_MS);
  });

  it('retries through a transient request failure and still completes', async () => {
    const clock = createVirtualClock();
    (ApiClient.getProcessingStatus as jest.Mock)
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce(status('COMPLETED'));

    const seen: string[] = [];
    const final = await UploadService.pollProcessingStatus(
      'proof_123',
      (s) => seen.push(s.overallStatus),
      { now: clock.now, sleep: clock.sleep },
    );

    expect(seen).toEqual(['COMPLETED']);
    expect(final?.overallStatus).toBe('COMPLETED');
    expect(clock.slept).toEqual([2_000]);
  });

  it('surfaces the last request error when the deadline passes without a reading', async () => {
    const clock = createVirtualClock();
    (ApiClient.getProcessingStatus as jest.Mock).mockRejectedValue(new Error('API 503'));

    await expect(
      UploadService.pollProcessingStatus('proof_123', () => {}, {
        now: clock.now,
        sleep: clock.sleep,
        deadlineMs: 10_000,
      }),
    ).rejects.toThrow('Could not reach the processing pipeline: API 503');
  });

  it('resolves null and stops polling once the caller cancels', async () => {
    const clock = createVirtualClock();
    let cancelled = false;
    (ApiClient.getProcessingStatus as jest.Mock).mockImplementation(async () => {
      cancelled = true;
      return status('PROCESSING');
    });

    const onUpdate = jest.fn();
    const final = await UploadService.pollProcessingStatus('proof_123', onUpdate, {
      now: clock.now,
      sleep: clock.sleep,
      isCancelled: () => cancelled,
    });

    expect(final).toBeNull();
    // Cancellation is checked before the reading is published, so a view that
    // has already unmounted never receives a state update.
    expect(onUpdate).not.toHaveBeenCalled();
    expect(ApiClient.getProcessingStatus).toHaveBeenCalledTimes(1);
  });
});
