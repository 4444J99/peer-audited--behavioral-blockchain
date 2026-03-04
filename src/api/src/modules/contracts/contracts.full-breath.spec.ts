import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { Pool } from 'pg';
import { TruthLogService } from '../../../services/ledger/truth-log.service';

describe('ContractsService (Full Breath Features)', () => {
  let service: ContractsService;
  let mockPool: { query: jest.Mock; connect?: jest.Mock };
  
  const mockTruthLog = {
    appendEvent: jest.fn().mockResolvedValue('log-id'),
  } as unknown as TruthLogService;

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    service = new ContractsService(
      mockPool as unknown as Pool,
      {} as any, // ledger
      mockTruthLog,
      {} as any, // stripe
      {} as any, // realStripe
      {} as any, // dispute
      {} as any, // furyRouter
      {} as any, // aegis
      {} as any, // recovery
      {} as any, // anomaly
    );
    jest.clearAllMocks();
  });

  describe('acceptPartnerInvitation', () => {
    it('should update partner status to ACTIVE and log event', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'ap-1' }] });

      const result = await service.acceptPartnerInvitation('contract-1', 'partner-1');

      expect(result).toEqual({ status: 'active' });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE accountability_partners SET status = 'ACTIVE'"),
        ['contract-1', 'partner-1'],
      );
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('PARTNER_INVITATION_ACCEPTED', {
        contractId: 'contract-1',
        partnerUserId: 'partner-1',
      });
    });

    it('should throw NotFoundException if no invitation found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.acceptPartnerInvitation('c1', 'p1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cosignAttestation', () => {
    it('should co-sign a pending attestation if requester is active partner', async () => {
      // 1. Partner check
      mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] });
      // 2. Find pending attestation
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'attest-1' }] });
      // 3. Update attestation
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.cosignAttestation('contract-1', 'partner-1');

      expect(result).toEqual({ status: 'cosigned' });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE attestations SET status = 'COSIGNED'"),
        ['attest-1', 'partner-1'],
      );
      expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('ATTESTATION_COSIGNED', {
        attestationId: 'attest-1',
        contractId: 'contract-1',
        partnerUserId: 'partner-1',
      });
    });

    it('should throw ForbiddenException if requester is not an active partner', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(service.cosignAttestation('c1', 'p1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no pending attestation exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }] }); // partner check passes
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // no attestation

      await expect(service.cosignAttestation('c1', 'p1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations for a user', async () => {
      const rows = [{ id: 'ap-1', owner_email: 'owner@styx.app' }];
      mockPool.query.mockResolvedValueOnce({ rows });

      const result = await service.getPendingInvitations('user-1');

      expect(result).toEqual(rows);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'PENDING'"),
        ['user-1'],
      );
    });
  });

  describe('processHealthKitSample', () => {
    it('should submit attestation if active contract matches sample type', async () => {
      // 1. Contract lookup
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'c-1' }] });
      
      // Mock submitAttestation
      jest.spyOn(service, 'submitAttestation').mockResolvedValue({ status: 'attested' } as any);

      await service.processHealthKitSample('user-1', {
        type: 'HKQuantityTypeIdentifierBodyMass',
        value: 180,
        startDate: '2026-03-04T00:00:00Z',
        endDate: '2026-03-04T00:00:00Z',
      });

      expect(service.submitAttestation).toHaveBeenCalledWith('c-1', 'user-1');
    });

    it('should ignore samples that do not match any stream', async () => {
      await service.processHealthKitSample('user-1', {
        type: 'UnknownType',
        value: 0,
        startDate: '',
        endDate: '',
      });

      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });
});
