"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moderation_service_1 = require("./moderation.service");
const common_1 = require("@nestjs/common");
describe('ModerationService', () => {
    let modService;
    const mockTruthLog = {
        appendEvent: jest.fn(),
    };
    const mockPool = {
        query: jest.fn(),
    };
    beforeEach(() => {
        modService = new moderation_service_1.ModerationService(mockTruthLog, mockPool);
        jest.clearAllMocks();
    });
    describe('banUser', () => {
        it('should verify admin role via DB, log ACCOUNT_BANNED event, and update user status', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ role: 'ADMIN' }] })
                .mockResolvedValueOnce({ rowCount: 1 });
            mockTruthLog.appendEvent.mockResolvedValueOnce('evt-ban-123');
            const result = await modService.banUser('admin-uuid-001', 'user_cheater', 'Failed 3 audits');
            expect(result.status).toBe('USER_PERMANENTLY_BANNED');
            expect(result.eventId).toBe('evt-ban-123');
            const roleCheckCall = mockPool.query.mock.calls[0];
            expect(roleCheckCall[0]).toContain('SELECT role FROM users');
            expect(roleCheckCall[1]).toEqual(['admin-uuid-001']);
            const appendCall = mockTruthLog.appendEvent.mock.calls[0];
            expect(appendCall[0]).toBe('ACCOUNT_BANNED');
            expect(appendCall[1].targetUserId).toBe('user_cheater');
            expect(appendCall[1].executedBy).toBe('admin-uuid-001');
            expect(appendCall[1].action).toBe('PERMANENT_EXILE');
            const statusUpdateCall = mockPool.query.mock.calls[1];
            expect(statusUpdateCall[0]).toContain("status = 'BANNED'");
            expect(statusUpdateCall[1]).toEqual(['user_cheater']);
        });
        it('should throw ForbiddenException if user has no ADMIN role in DB', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ role: 'USER' }] })
                .mockResolvedValueOnce({ rows: [{ role: 'USER' }] });
            await expect(modService.banUser('regular-user-uuid', 'user_cheater', 'I do not like them')).rejects.toThrow(common_1.ForbiddenException);
            await expect(modService.banUser('regular-user-uuid', 'user_cheater', 'I do not like them')).rejects.toThrow(/lacks the required 'ADMIN' role/);
            expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
        });
        it('should throw ForbiddenException if admin user not found in DB', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });
            await expect(modService.banUser('nonexistent-uuid', 'user_cheater', 'N/A')).rejects.toThrow(common_1.ForbiddenException);
            expect(mockTruthLog.appendEvent).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=moderation.service.spec.js.map