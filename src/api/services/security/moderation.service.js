"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const truth_log_service_1 = require("../ledger/truth-log.service");
let ModerationService = class ModerationService {
    constructor(truthLog, pool) {
        this.truthLog = truthLog;
        this.pool = pool;
    }
    async banUser(adminId, targetUserId, reason) {
        const adminResult = await this.pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
        if (adminResult.rows.length === 0 || adminResult.rows[0].role !== 'ADMIN') {
            throw new common_1.ForbiddenException(`Moderation Error: User ${adminId} lacks the required 'ADMIN' role to execute a system ban.`);
        }
        const payload = {
            targetUserId,
            reason,
            executedBy: adminId,
            action: 'PERMANENT_EXILE'
        };
        const logResult = await this.truthLog.appendEvent('ACCOUNT_BANNED', payload);
        await this.pool.query(`UPDATE users SET status = 'BANNED' WHERE id = $1`, [targetUserId]);
        return {
            status: 'USER_PERMANENTLY_BANNED',
            eventId: logResult
        };
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [truth_log_service_1.TruthLogService,
        pg_1.Pool])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map