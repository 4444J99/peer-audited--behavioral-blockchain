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

  it('allows the proof owner to fetch details with raw media and populated fields', async () => {
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
        masked_media_uri: 'proofs/1-masked.mp4',
        redaction_status: 'COMPLETED',
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
    // The owner is authorized for raw media even when a masked asset exists.
    expect(result.viewUrl).toBe('https://signed.example/view');
    expect(result.viewUrlIsRedacted).toBe(false);
    expect(mockR2.generateViewUrl).toHaveBeenCalledWith('proofs/1.mp4');
    // FINDING 2: these fields must be populated from the SELECT, not undefined.
    expect(result.contentType).toBe('video/mp4');
    expect(result.description).toBe('demo');
    expect(result.uploadedAt).toBe('2026-01-01T00:01:00Z');
  });

  it('serves the masked asset (never the raw media_uri) to an assigned Fury reviewer even when redaction_status is COMPLETED', async () => {
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
        masked_media_uri: 'proofs/1-masked.mp4',
        // Real-world value is 'COMPLETED' (or 'NOT_APPLICABLE'/null), never 'MASKED':
        // the gate must not key off this string or it would leak the raw media.
        redaction_status: 'COMPLETED',
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: '2026-01-01T00:01:00Z',
        is_honeypot: false,
        requester_role: 'USER',
        requester_enterprise_id: 'ent-2',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: true,
      }],
    });

    const result = await service.getProofDetail('proof-1', { userId: 'fury-1' });
    expect(result.id).toBe('proof-1');
    expect(result.viewUrl).toBe('https://signed.example/view');
    expect(result.viewUrlIsRedacted).toBe(true);
    expect(mockR2.generateViewUrl).toHaveBeenCalledWith('proofs/1-masked.mp4');
    // Critical: the raw media_uri must never be signed for a non-owner reader.
    expect(mockR2.generateViewUrl).not.toHaveBeenCalledWith('proofs/1.mp4');
  });

  it('serves no URL (never the raw media_uri) to a tenant admin when no masked asset exists, regardless of redaction_status', async () => {
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
        masked_media_uri: null,
        // No masked asset yet and a non-'MASKED' status: must serve nothing, not raw.
        redaction_status: 'NOT_APPLICABLE',
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: '2026-01-01T00:01:00Z',
        is_honeypot: false,
        requester_role: 'HR_ADMIN',
        requester_enterprise_id: 'ent-1',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: false,
      }],
    });

    const result = await service.getProofDetail('proof-1', { userId: 'tenant-admin-1' });
    expect(result.id).toBe('proof-1');
    expect(result.viewUrl).toBeNull();
    expect(result.viewUrlIsRedacted).toBe(false);
    // No fallback to raw media for a non-owner reader.
    expect(mockR2.generateViewUrl).not.toHaveBeenCalled();
  });

  it('serves no URL to an assigned Fury reviewer when redaction_status is null and no masked asset exists', async () => {
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
        masked_media_uri: null,
        redaction_status: null,
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
    expect(mockR2.generateViewUrl).not.toHaveBeenCalledWith('proofs/1.mp4');
  });

  it('allows a platform ADMIN to view raw media', async () => {
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
        masked_media_uri: 'proofs/1-masked.mp4',
        redaction_status: 'COMPLETED',
        submitted_at: '2026-01-01T00:00:00Z',
        uploaded_at: '2026-01-01T00:01:00Z',
        is_honeypot: false,
        requester_role: 'ADMIN',
        requester_enterprise_id: 'ent-9',
        contract_owner_enterprise_id: 'ent-1',
        requester_is_assigned_fury: false,
      }],
    });

    const result = await service.getProofDetail('proof-1', { userId: 'admin-1' });
    expect(result.viewUrl).toBe('https://signed.example/view');
    expect(result.viewUrlIsRedacted).toBe(false);
    expect(mockR2.generateViewUrl).toHaveBeenCalledWith('proofs/1.mp4');
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
