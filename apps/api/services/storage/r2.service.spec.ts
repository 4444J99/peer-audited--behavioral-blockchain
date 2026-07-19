import { R2StorageService } from './r2.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://r2.example.com/signed-url'),
}));

describe('R2StorageService', () => {
  let service: R2StorageService;

  beforeEach(() => {
    process.env.R2_BUCKET = 'test-bucket';
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.CLOUDFLARE_R2_ACCESS_KEY = 'test-key';
    process.env.CLOUDFLARE_R2_SECRET_KEY = 'test-secret';
    service = new R2StorageService();
  });

  describe('generateUploadUrl', () => {
    it('should return upload URL and key', async () => {
      const result = await service.generateUploadUrl('proof-123', 'video/mp4');
      expect(result.uploadUrl).toBe('https://r2.example.com/signed-url');
      expect(result.key).toMatch(/^proofs\/proof-123\/\d+\.mp4$/);
    });

    it('should handle content types without subtype', async () => {
      const result = await service.generateUploadUrl('proof-456', 'application/octet-stream');
      expect(result.key).toMatch(/\.octet-stream$/);
    });
  });

  describe('generateViewUrl', () => {
    it('should return a signed view URL', async () => {
      const url = await service.generateViewUrl('proofs/proof-123/12345.mp4');
      expect(url).toBe('https://r2.example.com/signed-url');
    });
  });
});
