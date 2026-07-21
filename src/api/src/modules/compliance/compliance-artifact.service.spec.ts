import { ComplianceArtifactService } from './compliance-artifact.service';
import { Pool } from 'pg';

describe('ComplianceArtifactService', () => {
  let service: ComplianceArtifactService;
  let mockPool: { query: jest.Mock };

  const mockRow = {
    artifact_type: 'skill_contest_whitepaper',
    version: '1.0.0',
    content_hash: 'abc123def456',
    signed_by: 'Counsel Name, Esq.',
    signed_at: new Date('2026-07-01T00:00:00Z'),
    expires_at: new Date('2027-07-01T00:00:00Z'),
    is_active: true,
    jurisdictions: ['US', 'US-CA', 'US-NY'],
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new ComplianceArtifactService(mockPool as unknown as Pool);
  });

  describe('getActiveArtifact', () => {
    it('returns the active artifact when one exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await service.getActiveArtifact('skill_contest_whitepaper');

      expect(result).not.toBeNull();
      expect(result!.artifactType).toBe('skill_contest_whitepaper');
      expect(result!.version).toBe('1.0.0');
      expect(result!.contentHash).toBe('abc123def456');
      expect(result!.signedBy).toBe('Counsel Name, Esq.');
      expect(result!.signedAt).toBe('2026-07-01T00:00:00.000Z');
      expect(result!.expiresAt).toBe('2027-07-01T00:00:00.000Z');
      expect(result!.isActive).toBe(true);
      expect(result!.jurisdictions).toEqual(['US', 'US-CA', 'US-NY']);
    });

    it('returns null when no active artifact exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getActiveArtifact('nonexistent_type');

      expect(result).toBeNull();
    });

    it('queries with the correct artifact type', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      await service.getActiveArtifact('fbo_custody_opinion');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE artifact_type = $1 AND is_active = true'),
        ['fbo_custody_opinion'],
      );
    });

    it('handles null optional fields', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{
          ...mockRow,
          signed_by: null,
          signed_at: null,
          expires_at: null,
        }],
      });

      const result = await service.getActiveArtifact('skill_contest_whitepaper');

      expect(result!.signedBy).toBeNull();
      expect(result!.signedAt).toBeNull();
      expect(result!.expiresAt).toBeNull();
    });
  });

  describe('getAllActiveArtifacts', () => {
    it('returns all active artifacts', async () => {
      mockPool.query.mockResolvedValue({
        rows: [mockRow, { ...mockRow, artifact_type: 'fbo_custody_opinion', version: '2.0.0' }],
      });

      const results = await service.getAllActiveArtifacts();

      expect(results).toHaveLength(2);
      expect(results[0].artifactType).toBe('skill_contest_whitepaper');
      expect(results[1].artifactType).toBe('fbo_custody_opinion');
      expect(results[1].version).toBe('2.0.0');
    });

    it('returns empty array when no artifacts exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const results = await service.getAllActiveArtifacts();

      expect(results).toEqual([]);
    });
  });

  describe('getArtifactByVersion', () => {
    it('returns artifact for the given type and version', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await service.getArtifactByVersion('skill_contest_whitepaper', '1.0.0');

      expect(result).not.toBeNull();
      expect(result!.version).toBe('1.0.0');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE artifact_type = $1 AND version = $2'),
        ['skill_contest_whitepaper', '1.0.0'],
      );
    });

    it('returns null when no matching version exists', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await service.getArtifactByVersion('skill_contest_whitepaper', '9.9.9');

      expect(result).toBeNull();
    });
  });
});
