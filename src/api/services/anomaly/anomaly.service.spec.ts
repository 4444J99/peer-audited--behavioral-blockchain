import { AnomalyService } from './anomaly.service';

describe('AnomalyService', () => {
  let service: AnomalyService;

  beforeEach(() => {
    service = new AnomalyService();
  });

  describe('pHash computation', () => {
    it('should produce a 16-char hex string', () => {
      const hash = service.computePHash('https://example.com/proof.mp4');
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should produce consistent hashes for the same input', () => {
      const hash1 = service.computePHash('https://example.com/proof.mp4');
      const hash2 = service.computePHash('https://example.com/proof.mp4');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.computePHash('https://example.com/proof1.mp4');
      const hash2 = service.computePHash('https://example.com/proof2.mp4');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Hamming distance', () => {
    it('should return 0 for identical hashes', () => {
      expect(service.hammingDistance('abcdef0123456789', 'abcdef0123456789')).toBe(0);
    });

    it('should return correct distance for differing hashes', () => {
      // 0x0 vs 0x1 = 1 bit difference
      expect(service.hammingDistance('0000000000000000', '0000000000000001')).toBe(1);
    });

    it('should return high distance for very different hashes', () => {
      const dist = service.hammingDistance('0000000000000000', 'ffffffffffffffff');
      expect(dist).toBe(64); // all 64 bits differ
    });
  });

  describe('duplicate detection', () => {
    it('should reject duplicate media uploads', async () => {
      const mediaUri = 'https://styx-proofs.r2.dev/user1/proof-001.mp4';
      const userId = 'user-001';

      // First upload should pass
      const first = await service.analyze(mediaUri, userId);
      expect(first.rejected).toBe(false);

      // Second upload of the same media should be rejected
      const second = await service.analyze(mediaUri, userId);
      expect(second.rejected).toBe(true);
      expect(second.reason).toContain('Duplicate media detected');
      expect(second.flags).toContain('PHASH_DUPLICATE');
    });

    it('should allow different media from the same user', async () => {
      const userId = 'user-002';

      const first = await service.analyze('https://proofs.r2.dev/first.mp4', userId);
      expect(first.rejected).toBe(false);

      const second = await service.analyze('https://proofs.r2.dev/second.mp4', userId);
      expect(second.rejected).toBe(false);
    });

    it('should detect cross-user duplicates', async () => {
      const mediaUri = 'https://styx-proofs.r2.dev/shared/proof.mp4';

      const first = await service.analyze(mediaUri, 'user-A');
      expect(first.rejected).toBe(false);

      const second = await service.analyze(mediaUri, 'user-B');
      expect(second.rejected).toBe(true);
      expect(second.flags).toContain('PHASH_DUPLICATE');
    });
  });

  describe('fail-open behavior', () => {
    it('should return unverified flag when analysis passes normally', async () => {
      const result = await service.analyze('https://proofs.r2.dev/normal.mp4', 'user-normal');
      expect(result.rejected).toBe(false);
      // Normal pass should not have the timeout flag
      expect(result.flags).not.toContain('ANALYSIS_TIMEOUT');
    });
  });
});
