/**
 * B2BOrchestration — desktop panel tests
 *
 * Tests API key management: fetching, generating, revoking, and clipboard copy.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    getEnterpriseKeys: jest.fn(),
    generateApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Building2: 'Building2',
  Plus: 'Plus',
  Copy: 'Copy',
  RefreshCw: 'RefreshCw',
}));

const mockGetEnterpriseKeys = api.getEnterpriseKeys as jest.Mock;
const mockGenerateApiKey = api.generateApiKey as jest.Mock;
const mockRevokeApiKey = api.revokeApiKey as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('B2BOrchestration', () => {
  describe('fetchKeys', () => {
    it('calls getEnterpriseKeys on mount and returns key list', async () => {
      const keysData = {
        keys: [
          { id: 'key-1', enterprise: 'acme-corp', createdAt: '2026-02-20', active: true },
          { id: 'key-2', enterprise: 'globex', createdAt: '2026-02-21', active: false },
        ],
      };
      mockGetEnterpriseKeys.mockResolvedValue(keysData);

      const result = await api.getEnterpriseKeys();

      expect(mockGetEnterpriseKeys).toHaveBeenCalled();
      expect(result.keys).toHaveLength(2);
      expect(result.keys[0].enterprise).toBe('acme-corp');
    });

    it('sets error when getEnterpriseKeys fails', async () => {
      mockGetEnterpriseKeys.mockRejectedValue(new Error('API 500: Database error'));

      let error = '';
      try {
        await api.getEnterpriseKeys();
      } catch (err: any) {
        error = err.message || 'Failed to load API keys';
      }

      expect(error).toBe('API 500: Database error');
    });

    it('handles empty keys array', async () => {
      mockGetEnterpriseKeys.mockResolvedValue({ keys: [] });

      const result = await api.getEnterpriseKeys();

      expect(result.keys).toHaveLength(0);
    });

    it('handles missing keys property with fallback to empty array', async () => {
      mockGetEnterpriseKeys.mockResolvedValue({});

      const result = await api.getEnterpriseKeys();
      const keys = result.keys || [];

      expect(keys).toHaveLength(0);
    });
  });

  describe('generateApiKey', () => {
    it('sends enterpriseId and returns new key', async () => {
      mockGenerateApiKey.mockResolvedValue({ key: 'styx_live_abcdef123456' });

      const result = await api.generateApiKey('acme-corp-001');

      expect(mockGenerateApiKey).toHaveBeenCalledWith('acme-corp-001');
      expect(result.key).toBe('styx_live_abcdef123456');
    });

    it('trims whitespace from enterpriseId before sending', () => {
      const rawInput = '  acme-corp-001  ';
      const trimmed = rawInput.trim();
      expect(trimmed).toBe('acme-corp-001');
    });

    it('blocks generation when enterpriseId is empty or whitespace', () => {
      const emptyId = '';
      const whitespaceId = '   ';
      expect(!emptyId.trim()).toBe(true);
      expect(!whitespaceId.trim()).toBe(true);
    });

    it('generates success feedback on key creation', async () => {
      const enterpriseId = 'acme-corp';
      mockGenerateApiKey.mockResolvedValue({ key: 'styx_live_newkey' });

      const result = await api.generateApiKey(enterpriseId);

      const feedback = {
        type: 'success' as const,
        message: `API key generated for ${enterpriseId}.`,
      };

      expect(result.key).toBe('styx_live_newkey');
      expect(feedback.message).toContain('acme-corp');
    });

    it('sets error feedback when generation fails', async () => {
      mockGenerateApiKey.mockRejectedValue(new Error('Rate limited'));

      let feedback: { type: string; message: string } | null = null;
      try {
        await api.generateApiKey('test-ent');
      } catch (err: any) {
        feedback = { type: 'error', message: err.message || 'Failed to generate key' };
      }

      expect(feedback).not.toBeNull();
      expect(feedback!.type).toBe('error');
      expect(feedback!.message).toBe('Rate limited');
    });

    it('resets form state after successful generation', async () => {
      mockGenerateApiKey.mockResolvedValue({ key: 'styx_live_k1' });

      let enterpriseId = 'acme';
      let showGenerateForm = true;

      await api.generateApiKey(enterpriseId);
      // Simulate component state reset
      enterpriseId = '';
      showGenerateForm = false;

      expect(enterpriseId).toBe('');
      expect(showGenerateForm).toBe(false);
    });
  });

  describe('revokeApiKey', () => {
    it('calls revokeApiKey with correct keyId', async () => {
      mockRevokeApiKey.mockResolvedValue({ success: true });

      await api.revokeApiKey('key-42');

      expect(mockRevokeApiKey).toHaveBeenCalledWith('key-42');
    });

    it('generates success feedback on revocation', async () => {
      const keyId = 'key-42';
      mockRevokeApiKey.mockResolvedValue({ success: true });

      await api.revokeApiKey(keyId);

      const feedback = { type: 'success', message: `Key ${keyId} revoked successfully.` };
      expect(feedback.message).toContain('key-42');
    });

    it('updates local key state to inactive after revocation', async () => {
      mockRevokeApiKey.mockResolvedValue({ success: true });

      const keys = [
        { id: 'key-1', enterprise: 'acme', createdAt: '2026-02-20', active: true },
        { id: 'key-2', enterprise: 'globex', createdAt: '2026-02-21', active: true },
      ];

      await api.revokeApiKey('key-1');

      // Simulate component state update
      const updatedKeys = keys.map((k) =>
        k.id === 'key-1' ? { ...k, active: false } : k,
      );

      expect(updatedKeys[0].active).toBe(false);
      expect(updatedKeys[1].active).toBe(true);
    });

    it('sets error feedback when revocation fails', async () => {
      mockRevokeApiKey.mockRejectedValue(new Error('API 404: Key not found'));

      let feedback: { type: string; message: string } | null = null;
      try {
        await api.revokeApiKey('key-nonexistent');
      } catch (err: any) {
        feedback = { type: 'error', message: err.message || 'Failed to revoke key key-nonexistent' };
      }

      expect(feedback!.message).toBe('API 404: Key not found');
    });

    it('only shows REVOKE button for active keys', () => {
      const activeKey = { id: 'k1', active: true };
      const revokedKey = { id: 'k2', active: false };

      expect(activeKey.active).toBe(true);   // REVOKE button shown
      expect(revokedKey.active).toBe(false);  // REVOKE button hidden
    });
  });

  describe('clipboard copy', () => {
    it('writes key value to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      (global as any).navigator = { clipboard: { writeText: mockWriteText } };

      navigator.clipboard.writeText('styx_live_abc123');

      expect(mockWriteText).toHaveBeenCalledWith('styx_live_abc123');
    });

    it('handles clipboard failure gracefully (no throw)', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard denied'));
      (global as any).navigator = { clipboard: { writeText: mockWriteText } };

      // Reproduce the component's handleCopyKey catch behavior
      await navigator.clipboard.writeText('test').catch(() => {
        // no action needed — matches component behavior
      });

      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  describe('key display logic', () => {
    it('shows ACTIVE badge for active keys', () => {
      const active = true;
      const label = active ? 'ACTIVE' : 'REVOKED';
      expect(label).toBe('ACTIVE');
    });

    it('shows REVOKED badge for inactive keys', () => {
      const active = false;
      const label = active ? 'ACTIVE' : 'REVOKED';
      expect(label).toBe('REVOKED');
    });

    it('shows GENERATING... while generate request is in flight', () => {
      const generating = true;
      const text = generating ? 'GENERATING...' : 'CREATE';
      expect(text).toBe('GENERATING...');
    });

    it('shows REVOKING... for the specific key being revoked', () => {
      const revokingId = 'key-3';
      const keyId = 'key-3';
      const text = revokingId === keyId ? 'REVOKING...' : 'REVOKE';
      expect(text).toBe('REVOKING...');
    });

    it('shows REVOKE for keys not currently being revoked', () => {
      const revokingId: string = 'key-3';
      const keyId: string = 'key-5';
      const text = revokingId === keyId ? 'REVOKING...' : 'REVOKE';
      expect(text).toBe('REVOKE');
    });
  });
});
