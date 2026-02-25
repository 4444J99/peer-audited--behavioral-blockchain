"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const honeypot_service_1 = require("./honeypot.service");
describe('HoneypotInjectorService', () => {
    let honeypotService;
    const mockRouter = {
        routeProof: jest.fn(),
    };
    const mockPool = { query: jest.fn(), connect: jest.fn() };
    const mockTruthLog = { appendEvent: jest.fn() };
    beforeEach(() => {
        honeypotService = new honeypot_service_1.HoneypotService(mockPool, mockRouter, mockTruthLog);
        jest.clearAllMocks();
    });
    describe('injectHoneypot', () => {
        it('should query for furies and inject honeypot proof', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'contract-abc', user_id: 'user-xyz' }] });
            mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'proof-hp-123' }] });
            mockRouter.routeProof.mockResolvedValueOnce('mock-job-123');
            await honeypotService.injectHoneypot();
            expect(mockRouter.routeProof).toHaveBeenCalledWith('proof-hp-123', 'user-xyz', 3);
            expect(mockTruthLog.appendEvent).toHaveBeenCalledWith('HONEYPOT_INJECTED', expect.any(Object));
        });
        it('should skip injection if not enough furies', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
            await honeypotService.injectHoneypot();
            expect(mockRouter.routeProof).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=honeypot.service.spec.js.map