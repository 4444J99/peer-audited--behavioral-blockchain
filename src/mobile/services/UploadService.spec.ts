import { UploadService } from './UploadService';

jest.mock('./SessionService', () => ({
  SessionService: {
    getToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  },
}));

const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('UploadService', () => {
  it('requestPreSignedUrl() calls API and returns uploadUrl and proofId', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uploadUrl: 'https://r2.example.com/upload?sig=abc',
        proofId: 'proof_123',
      }),
    });

    const result = await UploadService.requestPreSignedUrl('video/mp4');

    expect(result).toEqual({
      uploadUrl: 'https://r2.example.com/upload?sig=abc',
      proofId: 'proof_123',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/contracts/proof/upload-url'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }),
      }),
    );
  });

  it('requestPreSignedUrl() throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(UploadService.requestPreSignedUrl('video/mp4'))
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

  it('confirmUploadDispatch() calls dispatch endpoint and returns true', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const ok = await UploadService.confirmUploadDispatch('proof_123');

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/contracts/proof_123/dispatch'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }),
      }),
    );
  });

  it('confirmUploadDispatch() returns false on failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const ok = await UploadService.confirmUploadDispatch('proof_123');

    expect(ok).toBe(false);
  });
});
