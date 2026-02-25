"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ledger_service_1 = require("./ledger.service");
const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};
const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
};
describe('LedgerService', () => {
    let service;
    beforeEach(() => {
        service = new ledger_service_1.LedgerService(mockPool);
        jest.clearAllMocks();
    });
    it('should successfully record a transaction with BEGIN and COMMIT', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 'mock-uuid-123' }] })
            .mockResolvedValueOnce({ rows: [] });
        const resultId = await service.recordTransaction('account-A', 'account-B', 50.0);
        expect(resultId).toBe('mock-uuid-123');
        expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mockClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });
    it('should execute a ROLLBACK on error and re-throw', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockRejectedValueOnce(new Error('Simulated Database Error'));
        await expect(service.recordTransaction('account-A', 'account-B', 50.0))
            .rejects
            .toThrow('Simulated Database Error');
        expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mockClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });
    it('should reject non-positive amounts', async () => {
        await expect(service.recordTransaction('account-A', 'account-B', -10))
            .rejects
            .toThrow('Transaction amount must be strictly positive');
        expect(mockPool.connect).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=ledger.service.spec.js.map