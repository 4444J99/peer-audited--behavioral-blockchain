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
  };

  beforeEach(async () => {
    enforcementService = {
      evaluateCollusion: jest.fn(),
      appealCase: jest.fn(),
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

  describe('appeal', () => {
    it('calls enforcementService.appealCase and returns the result', async () => {
      const appealResult = { caseId: 'case-456', status: 'PENDING' };
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
});
