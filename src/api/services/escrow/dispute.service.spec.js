"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dispute_service_1 = require("./dispute.service");
const common_1 = require("@nestjs/common");
describe('DisputeService', () => {
    let disputeService;
    let mockStripeService;
    let mockPool;
    let mockTruthLog;
    let mockLedger;
    beforeEach(() => {
        mockStripeService = {
            holdStake: jest.fn(),
            captureStake: jest.fn(),
            refundStake: jest.fn(),
            transferBounty: jest.fn(),
        };
        mockPool = {
            query: jest.fn(),
        };
        mockTruthLog = {
            appendEvent: jest.fn(),
        };
        mockLedger = {
            recordTransaction: jest.fn(),
        };
        const stripeMock = {
            holdStake: jest.fn(),
            captureStake: jest.fn(),
            refundStake: jest.fn(),
            transferBounty: jest.fn(),
        };
        mockStripeService = stripeMock;
        disputeService = new dispute_service_1.DisputeService(mockPool, stripeMock, mockTruthLog, mockLedger);
        jest.clearAllMocks();
    });
    describe('initiateAppeal', () => {
        it('should successfully initiate an appeal if the $5 fee holds', async () => {
            mockStripeService.holdStake.mockResolvedValueOnce({
                id: 'pi_test_appeal_fee',
                status: 'requires_capture',
            });
            const result = await disputeService.initiateAppeal('user-1', 'proof-1', 'cus_123');
            expect(result.appealStatus).toBe('FEE_AUTHORIZED_PENDING_REVIEW');
            expect(result.paymentIntentId).toBe('pi_test_appeal_fee');
            const holdCallArgs = mockStripeService.holdStake.mock.calls[0];
            expect(holdCallArgs[0]).toBe('cus_123');
            expect(holdCallArgs[1]).toBe(5);
        });
        it('should throw HttpException (402) if the appeal fee cannot be authorized', async () => {
            mockStripeService.holdStake.mockRejectedValueOnce(new Error('Card declined'));
            await expect(disputeService.initiateAppeal('user-2', 'proof-2', 'cus_456')).rejects.toThrow(common_1.HttpException);
            await expect(disputeService.initiateAppeal('user-2', 'proof-2', 'cus_456')).rejects.toThrow(/Could not authorize the \$5 appeal fee/);
        });
    });
});
//# sourceMappingURL=dispute.service.spec.js.map