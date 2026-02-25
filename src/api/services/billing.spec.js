"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const billing_1 = require("./billing");
describe('processIAP', () => {
    let mockPool;
    let mockStripe;
    let mockLedger;
    let mockTruthLog;
    beforeEach(() => {
        mockPool = { query: jest.fn() };
        mockStripe = {
            holdStake: jest.fn(),
            captureStake: jest.fn(),
        };
        mockLedger = { recordTransaction: jest.fn() };
        mockTruthLog = { appendEvent: jest.fn() };
        jest.clearAllMocks();
    });
    it('should create a payment intent, capture it, record ledger entry, and log to truth log', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ stripe_customer_id: 'cus_test', account_id: 'acc-1' }],
        });
        mockStripe.holdStake.mockResolvedValueOnce({ id: 'pi_test_123' });
        mockStripe.captureStake.mockResolvedValueOnce(undefined);
        mockPool.query.mockResolvedValueOnce({
            rows: [{ id: 'acc-revenue' }],
        });
        mockLedger.recordTransaction.mockResolvedValueOnce(undefined);
        mockTruthLog.appendEvent.mockResolvedValueOnce(undefined);
        const result = await (0, billing_1.processIAP)(mockPool, mockStripe, mockLedger, mockTruthLog, 'user-1', 'contract-1');
        expect(result).toEqual({
            paymentIntentId: 'pi_test_123',
            amount: billing_1.TICKET_PRICE_BASE,
        });
        expect(mockStripe.holdStake).toHaveBeenCalledWith('cus_test', billing_1.TICKET_PRICE_BASE, 'contract-1');
        expect(mockStripe.captureStake).toHaveBeenCalledWith('pi_test_123');
        expect(mockLedger.recordTransaction).toHaveBeenCalledWith('acc-1', 'acc-revenue', billing_1.TICKET_PRICE_BASE, 'contract-1', { type: 'TICKET_PURCHASE', userId: 'user-1' });
        expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('TICKET_PURCHASED', {
            userId: 'user-1',
            contractId: 'contract-1',
            amount: billing_1.TICKET_PRICE_BASE,
            paymentIntentId: 'pi_test_123',
        });
    });
    it('should throw when user is not found', async () => {
        mockPool.query.mockResolvedValueOnce({ rows: [] });
        await expect((0, billing_1.processIAP)(mockPool, mockStripe, mockLedger, mockTruthLog, 'no-user', 'c-1')).rejects.toThrow('User no-user not found');
    });
    it('should throw when user has no stripe customer id', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ stripe_customer_id: null, account_id: 'acc-1' }],
        });
        await expect((0, billing_1.processIAP)(mockPool, mockStripe, mockLedger, mockTruthLog, 'user-no-stripe', 'c-1')).rejects.toThrow('User has no payment method on file');
    });
    it('should still succeed when user has no ledger account (no account_id)', async () => {
        mockPool.query.mockResolvedValueOnce({
            rows: [{ stripe_customer_id: 'cus_test', account_id: null }],
        });
        mockStripe.holdStake.mockResolvedValueOnce({ id: 'pi_no_acc' });
        mockStripe.captureStake.mockResolvedValueOnce(undefined);
        mockTruthLog.appendEvent.mockResolvedValueOnce(undefined);
        const result = await (0, billing_1.processIAP)(mockPool, mockStripe, mockLedger, mockTruthLog, 'user-no-acc', 'c-2');
        expect(result.paymentIntentId).toBe('pi_no_acc');
        expect(mockLedger.recordTransaction).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=billing.spec.js.map