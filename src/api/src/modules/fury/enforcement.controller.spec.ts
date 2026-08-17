import { Test, TestingModule } from '@nestjs/testing';
import { EnforcementController } from './enforcement.controller';
import { EnforcementService } from './enforcement.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';

describe('EnforcementController', () => {
  let controller: EnforcementController;
  let enforcementService: {
    evaluateCollusion: jest.Mock;
    appealCase: jest.Mock;
    confirmCase: jest.Mock;
    resolveAppeal: jest.Mock;
    listCases: jest.Mock;
    listCollusionRings: jest.Mock;
  };

  beforeEach(async () => {
    enforcementService = {
      evaluateCollusion: jest.fn(),
      appealCase: jest.fn(),
      confirmCase: jest.fn(),
      resolveAppeal: jest.fn(),
      listCases: jest.fn(),
      listCollusionRings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnforcementController],
      providers: [{ provide: EnforcementService, useValue: enforcementService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EnforcementController>(EnforcementController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluate', () => {
    it('calls enforcementService.evaluateCollusion and returns success', async () => {
      enforcementService.evaluateCollusion.mockResolvedValue(undefined);

      const dto = { proofId: 'proof-123', flaggedFuries: ['fury-1', 'fury-2'] };
      const result = await controller.evaluate(dto);

      expect(enforcementService.evaluateCollusion).toHaveBeenCalledWith(
        'proof-123',
        ['fury-1', 'fury-2'],
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('confirm', () => {
    it('calls confirmCase with default penalty type', async () => {
      enforcementService.confirmCase.mockResolvedValue({
        success: true,
        caseId: 'case-1',
        status: 'PENALTY_APPLIED',
      });

      const result = await controller.confirm('case-1', {});

      // A missing amount must reach the service AS MISSING. The controller used
      // to coerce it with `dto.amountCents || 0`, which turned an omitted amount
      // into a free STAKE_SLASH; the service now derives the real amount (or
      // rejects a non-positive one) and can only do that if it sees undefined.
      expect(enforcementService.confirmCase).toHaveBeenCalledWith('case-1', 'REP_BURN', undefined);
      expect(result.status).toBe('PENALTY_APPLIED');
    });

    it('passes custom penalty type and amount', async () => {
      enforcementService.confirmCase.mockResolvedValue({
        success: true,
        caseId: 'case-2',
        status: 'PENALTY_APPLIED',
      });

      const result = await controller.confirm('case-2', {
        penaltyType: 'STAKE_SLASH',
        amountCents: 5000,
      });

      expect(enforcementService.confirmCase).toHaveBeenCalledWith('case-2', 'STAKE_SLASH', 5000);
    });
  });

  describe('appeal', () => {
    it('calls enforcementService.appealCase and returns the result', async () => {
      const appealResult = { caseId: 'case-456', status: 'APPEALED' };
      enforcementService.appealCase.mockResolvedValue(appealResult);

      const user = { id: 'user-789' };
      const dto = { reason: 'I was unfairly flagged' };

      const result = await controller.appeal('case-456', user, dto);

      expect(enforcementService.appealCase).toHaveBeenCalledWith(
        'case-456',
        'user-789',
        'I was unfairly flagged',
      );
      expect(result).toEqual(appealResult);
    });
  });

  describe('resolveAppeal', () => {
    it('calls resolveAppeal with UPHELD outcome', async () => {
      enforcementService.resolveAppeal.mockResolvedValue({
        success: true,
        caseId: 'case-789',
        outcome: 'UPHELD',
      });

      const result = await controller.resolveAppeal('case-789', {
        outcome: 'UPHELD',
        reason: 'Penalty confirmed after review',
      });

      expect(enforcementService.resolveAppeal).toHaveBeenCalledWith(
        'case-789',
        'UPHELD',
        'Penalty confirmed after review',
      );
      expect(result.outcome).toBe('UPHELD');
    });

    it('calls resolveAppeal with REVERSED outcome', async () => {
      enforcementService.resolveAppeal.mockResolvedValue({
        success: true,
        caseId: 'case-789',
        outcome: 'REVERSED',
      });

      const result = await controller.resolveAppeal('case-789', {
        outcome: 'REVERSED',
      });

      expect(enforcementService.resolveAppeal).toHaveBeenCalledWith(
        'case-789',
        'REVERSED',
        undefined,
      );
      expect(result.outcome).toBe('REVERSED');
    });
  });
  describe('listCases', () => {
    it('passes the status/caseType filters straight through', async () => {
      enforcementService.listCases.mockResolvedValue({ cases: [] });

      const result = await controller.listCases('PENDING_REVIEW', 'COLLUSION_RING', '25');

      expect(enforcementService.listCases).toHaveBeenCalledWith({
        status: 'PENDING_REVIEW',
        caseType: 'COLLUSION_RING',
        limit: 25,
      });
      expect(result).toEqual({ cases: [] });
    });

    it('hands an absent limit to the service as NaN so the service clamps it', async () => {
      enforcementService.listCases.mockResolvedValue({ cases: [] });

      await controller.listCases();

      expect(enforcementService.listCases).toHaveBeenCalledWith({
        status: undefined,
        caseType: undefined,
        limit: NaN,
      });
    });
  });

  describe('listRings', () => {
    it('returns the grouped rings for the admin screen', async () => {
      const rings = [{ ring_id: 'ring-1', member_count: 3 }];
      enforcementService.listCollusionRings.mockResolvedValue({ rings });

      const result = await controller.listRings('48', '10');

      expect(enforcementService.listCollusionRings).toHaveBeenCalledWith({
        sinceHours: 48,
        limit: 10,
      });
      expect(result).toEqual({ rings });
    });
  });
});
