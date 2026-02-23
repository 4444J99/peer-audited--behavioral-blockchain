import { PaymentsController } from './payments.controller';
import { ContractsService } from '../contracts/contracts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Pool } from 'pg';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPool: { query: jest.Mock };
  let mockContractsService: { resolveContract: jest.Mock };
  let mockNotifications: { create: jest.Mock };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockContractsService = { resolveContract: jest.fn().mockResolvedValue(undefined) };
    mockNotifications = { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) };

    controller = new PaymentsController(
      mockPool as unknown as Pool,
      mockContractsService as unknown as ContractsService,
      mockNotifications as unknown as NotificationsService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 400 for missing signature', async () => {
    const req = { headers: {}, rawBody: Buffer.from('{}') } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    await controller.handleWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature' });
  });

  it('should return 400 when webhook secret is empty', async () => {
    const req = {
      headers: { 'stripe-signature': 'sig_test' },
      rawBody: Buffer.from('{}'),
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    // Controller is created with empty webhook secret by default in test
    await controller.handleWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should throw on startup in production without STRIPE_WEBHOOK_SECRET', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const prodController = new PaymentsController(
      mockPool as unknown as Pool,
      mockContractsService as unknown as ContractsService,
      mockNotifications as unknown as NotificationsService,
    );

    expect(() => prodController.onModuleInit()).toThrow(
      'STRIPE_WEBHOOK_SECRET must be set in production',
    );

    process.env.NODE_ENV = original;
  });
});
