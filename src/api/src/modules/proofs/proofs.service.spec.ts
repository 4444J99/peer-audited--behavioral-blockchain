import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { R2StorageService } from '../../../services/storage/r2.service';
import { ProofsService } from './proofs.service';

describe('ProofsService', () => {
  let service: ProofsService;
  let mockPool: { query: jest.Mock };
  let mockR2: { generateViewUrl: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockR2 = {
      generateViewUrl: jest.fn().mockResolvedValue('https://signed.example/view'),
    };

    service = new ProofsService(
      mockPool as unknown as Pool,
      mockR2 as unknown as R2StorageService,
    );
  });

  it('allows the proof owner to fetch details', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'proof-1',
        contract_id: 'contract-1',
        user_id: 'owner-1',
        contract_owner_id: 'owner-1',
        status: 'PENDING_REVIEW',
        content_type: 'video/mp4',
        description: 'demo',
        media_uri: 'proofs/1.mp4',
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: '2026-01-01T00:01:00Z',
        is_honeypot: false,
        requester_role: 'USER',
        requester_enterprise_id: 'ent-1',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: false,
      }],
    });

    const result = await service.getProofDetail('proof-1', { userId: 'owner-1' });

    expect(result.id).toBe('proof-1');
    expect(result.viewUrl).toBe('https://signed.example/view');
    expect(mockR2.generateViewUrl).toHaveBeenCalledWith('proofs/1.mp4');
  });

  it('allows assigned Fury reviewer access', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'proof-1',
        contract_id: 'contract-1',
        user_id: 'owner-1',
        contract_owner_id: 'owner-1',
        status: 'PENDING_REVIEW',
        content_type: 'video/mp4',
        description: null,
        media_uri: null,
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: null,
        is_honeypot: false,
        requester_role: 'USER',
        requester_enterprise_id: 'ent-2',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: true,
      }],
    });

    const result = await service.getProofDetail('proof-1', { userId: 'fury-1' });
    expect(result.id).toBe('proof-1');
    expect(result.viewUrl).toBeNull();
  });

  it('rejects unauthorized users', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'proof-1',
        contract_id: 'contract-1',
        user_id: 'owner-1',
        contract_owner_id: 'owner-1',
        status: 'PENDING_REVIEW',
        content_type: 'video/mp4',
        description: null,
        media_uri: 'proofs/1.mp4',
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: null,
        is_honeypot: false,
        requester_role: 'USER',
        requester_enterprise_id: 'ent-2',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: false,
      }],
    });

    await expect(service.getProofDetail('proof-1', { userId: 'intruder-1' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockR2.generateViewUrl).not.toHaveBeenCalled();
  });

  it('throws when the proof does not exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await expect(service.getProofDetail('missing-proof', { userId: 'user-1' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
