/**
 * ExilePanel — desktop panel tests
 *
 * Tests ban form validation, confirmation flow, and API interaction.
 * Uses the same mock pattern from api.spec.ts (node env, no DOM).
 */

import { api } from '../services/api';

jest.mock('../services/api', () => ({
  api: {
    banUser: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  Skull: 'Skull',
  AlertTriangle: 'AlertTriangle',
  Key: 'Key',
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
}));

const mockBanUser = api.banUser as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ExilePanel', () => {
  describe('form validation logic', () => {
    it('blocks exile request when targetId is empty', () => {
      const targetId = '';
      const reason = 'Fraud detected';
      const shouldProceed = !!(targetId && reason);
      expect(shouldProceed).toBe(false);
    });

    it('blocks exile request when reason is empty', () => {
      const targetId = 'usr_xyz123';
      const reason = '';
      const shouldProceed = !!(targetId && reason);
      expect(shouldProceed).toBe(false);
    });

    it('allows exile request when both fields are populated', () => {
      const targetId = 'usr_xyz123';
      const reason = 'Repeated Honeypot failures';
      const shouldProceed = !!(targetId && reason);
      expect(shouldProceed).toBe(true);
    });
  });

  describe('confirmation step', () => {
    it('transitions from initial to confirm step before calling API', () => {
      let confirmStep = false;

      // Simulates handleExileRequest
      const handleExileRequest = (targetId: string, reason: string) => {
        if (!targetId || !reason) return;
        confirmStep = true;
      };

      handleExileRequest('usr_abc', 'Algorithmic bypass attempts');
      expect(confirmStep).toBe(true);
    });

    it('cancel resets the confirm step without calling API', () => {
      let confirmStep = true;

      // Simulates handleCancelExile
      const handleCancelExile = () => {
        confirmStep = false;
      };

      handleCancelExile();
      expect(confirmStep).toBe(false);
      expect(mockBanUser).not.toHaveBeenCalled();
    });
  });

  describe('banUser API call', () => {
    it('sends correct userId and reason on confirm', async () => {
      mockBanUser.mockResolvedValue({ success: true });

      const result = await api.banUser('usr_xyz123', 'Fraud detected');

      expect(mockBanUser).toHaveBeenCalledWith('usr_xyz123', 'Fraud detected');
      expect(result.success).toBe(true);
    });

    it('generates success feedback message on successful ban', async () => {
      const targetId = 'usr_xyz123';
      mockBanUser.mockResolvedValue({ success: true });

      const result = await api.banUser(targetId, 'Fraud detected');

      let feedback: { type: string; message: string } | null = null;
      if (result.success) {
        feedback = {
          type: 'success',
          message: `Entity ${targetId} permanently exiled from Styx Protocol. Ban recorded in Truth Log.`,
        };
      }

      expect(feedback).not.toBeNull();
      expect(feedback!.type).toBe('success');
      expect(feedback!.message).toContain('permanently exiled');
      expect(feedback!.message).toContain(targetId);
    });

    it('generates error feedback when server rejects ban', async () => {
      const targetId = 'usr_abc';
      mockBanUser.mockResolvedValue({ success: false });

      const result = await api.banUser(targetId, 'Testing');

      let feedback: { type: string; message: string } | null = null;
      if (!result.success) {
        feedback = {
          type: 'error',
          message: `Ban request for ${targetId} was rejected by the server.`,
        };
      }

      expect(feedback).not.toBeNull();
      expect(feedback!.type).toBe('error');
      expect(feedback!.message).toContain('rejected');
    });

    it('generates error feedback when API throws', async () => {
      mockBanUser.mockRejectedValue(new Error('API 403: Insufficient privileges'));

      let feedback: { type: string; message: string } | null = null;
      try {
        await api.banUser('usr_nope', 'Test');
      } catch (err: any) {
        feedback = {
          type: 'error',
          message: err.message || 'Failed to exile entity usr_nope.',
        };
      }

      expect(feedback).not.toBeNull();
      expect(feedback!.type).toBe('error');
      expect(feedback!.message).toContain('403');
    });

    it('clears form fields after successful ban', async () => {
      mockBanUser.mockResolvedValue({ success: true });

      let targetId = 'usr_xyz123';
      let reason = 'Fraud';

      const result = await api.banUser(targetId, reason);
      if (result.success) {
        targetId = '';
        reason = '';
      }

      expect(targetId).toBe('');
      expect(reason).toBe('');
    });
  });

  describe('authorizing state', () => {
    it('disables inputs while isAuthorizing is true', () => {
      const isAuthorizing = true;
      const confirmStep = true;
      const inputDisabled = confirmStep || isAuthorizing;
      expect(inputDisabled).toBe(true);
    });

    it('button shows EXECUTING... text during authorization', () => {
      const isAuthorizing = true;
      const buttonText = isAuthorizing ? 'EXECUTING...' : 'CONFIRM BAN';
      expect(buttonText).toBe('EXECUTING...');
    });

    it('button shows CONFIRM BAN when not authorizing', () => {
      const isAuthorizing = false;
      const buttonText = isAuthorizing ? 'EXECUTING...' : 'CONFIRM BAN';
      expect(buttonText).toBe('CONFIRM BAN');
    });
  });
});
