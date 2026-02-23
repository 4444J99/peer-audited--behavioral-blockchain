import { UploadService } from './UploadService';

describe('UploadService', () => {
  it('requestPreSignedUrl() returns uploadUrl and proofId', async () => {
    const result = await UploadService.requestPreSignedUrl('video/mp4');

    expect(result).toHaveProperty('uploadUrl');
    expect(result).toHaveProperty('proofId');
    expect(result.uploadUrl).toContain('https://');
    expect(result.proofId).toMatch(/^proof_/);
  });

  it('uploadVideoBuffer() returns true on success', async () => {
    const ok = await UploadService.uploadVideoBuffer(
      'file:///local/video.mp4',
      'https://mock-r2.cloudflare.styx.net/bucket/upload?sig=x',
    );

    expect(ok).toBe(true);
  });

  it('confirmUploadDispatch() returns true', async () => {
    const ok = await UploadService.confirmUploadDispatch('proof_123');

    expect(ok).toBe(true);
  });
});
