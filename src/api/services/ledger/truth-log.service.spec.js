"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const truth_log_service_1 = require("./truth-log.service");
const crypto_1 = require("crypto");
const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};
const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
};
describe('TruthLogService', () => {
    let service;
    beforeEach(() => {
        service = new truth_log_service_1.TruthLogService(mockPool);
        jest.clearAllMocks();
    });
    it('should append event using GENESIS_HASH if table is empty', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 'new-log-1' }] })
            .mockResolvedValueOnce({ rows: [] });
        const payload = { action: 'start_habit' };
        const resultId = await service.appendEvent('TEST_EVENT', payload);
        expect(resultId).toBe('new-log-1');
        const expectedHash = (0, crypto_1.createHash)('sha256')
            .update(`GENESIS_HASH${JSON.stringify(payload)}`)
            .digest('hex');
        const insertCallArgs = mockClient.query.mock.calls[2];
        expect(insertCallArgs[0]).toContain('INSERT INTO event_log');
        expect(insertCallArgs[1][2]).toBe('GENESIS_HASH');
        expect(insertCallArgs[1][3]).toBe(expectedHash);
    });
    it('should append event chaining the previous hash correctly', async () => {
        mockClient.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ current_hash: 'abc123oldhash' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'new-log-2' }] })
            .mockResolvedValueOnce({ rows: [] });
        const payload = { action: 'complete_habit' };
        await service.appendEvent('TEST_EVENT', payload);
        const expectedHash = (0, crypto_1.createHash)('sha256')
            .update(`abc123oldhash${JSON.stringify(payload)}`)
            .digest('hex');
        const insertCallArgs = mockClient.query.mock.calls[2];
        expect(insertCallArgs[1][2]).toBe('abc123oldhash');
        expect(insertCallArgs[1][3]).toBe(expectedHash);
    });
});
//# sourceMappingURL=truth-log.service.spec.js.map