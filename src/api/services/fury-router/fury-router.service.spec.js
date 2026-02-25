"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fury_router_service_1 = require("./fury-router.service");
describe('FuryRouterService', () => {
    let service;
    const mockQueue = {
        add: jest.fn(),
    };
    beforeEach(() => {
        service = new fury_router_service_1.FuryRouterService();
        service.setQueue(mockQueue);
        jest.clearAllMocks();
    });
    describe('routeProof', () => {
        it('should enqueue a job with the correct parameters and exclude submitter logic params', async () => {
            mockQueue.add.mockResolvedValueOnce({ id: 'bullmq-job-999' });
            const proofId = 'proof-uuid-123';
            const submitterId = 'user-abc';
            const returnedJobId = await service.routeProof(proofId, submitterId, 3);
            expect(returnedJobId).toBe('bullmq-job-999');
            const addCall = mockQueue.add.mock.calls[0];
            expect(addCall[0]).toBe('route-fury-review');
            expect(addCall[1].proofId).toBe(proofId);
            expect(addCall[1].submitterUserId).toBe(submitterId);
            expect(addCall[1].requiredReviewers).toBe(3);
            expect(addCall[1].dispatchedAt).toBeDefined();
            expect(addCall[2].attempts).toBe(3);
        });
    });
});
//# sourceMappingURL=fury-router.service.spec.js.map