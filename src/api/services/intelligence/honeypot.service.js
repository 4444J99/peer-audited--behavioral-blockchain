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
var HoneypotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoneypotService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const pg_1 = require("pg");
const fury_router_service_1 = require("../fury-router/fury-router.service");
const truth_log_service_1 = require("../ledger/truth-log.service");
let HoneypotService = HoneypotService_1 = class HoneypotService {
    constructor(pool, furyRouter, truthLog) {
        this.pool = pool;
        this.furyRouter = furyRouter;
        this.truthLog = truthLog;
        this.logger = new common_1.Logger(HoneypotService_1.name);
    }
    async injectHoneypot() {
        try {
            const furyCount = await this.pool.query(`SELECT COUNT(*) as count FROM users
         WHERE status = 'ACTIVE'
           AND role IN ('USER', 'FURY', 'ADMIN')
           AND integrity_score >= 20`);
            const activeFuries = Number(furyCount.rows[0].count);
            if (activeFuries < HoneypotService_1.MIN_FURIES_FOR_INJECTION) {
                this.logger.debug(`Skipping honeypot injection: only ${activeFuries} active Furies (need ${HoneypotService_1.MIN_FURIES_FOR_INJECTION})`);
                return;
            }
            const contractResult = await this.pool.query(`SELECT id, user_id FROM contracts
         WHERE status = 'ACTIVE'
         ORDER BY RANDOM()
         LIMIT 1`);
            if (contractResult.rows.length === 0) {
                this.logger.debug('Skipping honeypot injection: no active contracts found');
                return;
            }
            const hostContract = contractResult.rows[0];
            const proofResult = await this.pool.query(`INSERT INTO proofs (
           contract_id, user_id, status, content_type, description,
           media_uri, is_honeypot, honeypot_expected_verdict, submitted_at, uploaded_at
         )
         VALUES ($1, $2, 'PENDING_REVIEW', 'video/mp4', 'Compliance proof — automated verification',
                 $3, true, 'FAIL', NOW(), NOW())
         RETURNING id`, [
                hostContract.id,
                hostContract.user_id,
                `honeypots/synthetic/${Date.now()}.mp4`,
            ]);
            const honeypotProofId = proofResult.rows[0].id;
            const jobId = await this.furyRouter.routeProof(honeypotProofId, hostContract.user_id, 3);
            await this.truthLog.appendEvent('HONEYPOT_INJECTED', {
                proofId: honeypotProofId,
                hostContractId: hostContract.id,
                furyRouteJobId: jobId,
                expectedVerdict: 'FAIL',
            });
            this.logger.log(`Honeypot proof ${honeypotProofId} injected and routed (jobId: ${jobId})`);
        }
        catch (err) {
            this.logger.error(`Honeypot injection failed: ${err.message}`);
        }
    }
    async gradeHoneypotPerformance(proofId, flaggedFuries) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const assignments = await client.query(`SELECT fury_user_id, verdict FROM fury_assignments
         WHERE proof_id = $1 AND verdict IS NOT NULL`, [proofId]);
            for (const assignment of assignments.rows) {
                const isCorrect = assignment.verdict === 'FAIL';
                const delta = isCorrect
                    ? HoneypotService_1.HONEYPOT_CORRECT_BONUS
                    : -HoneypotService_1.HONEYPOT_MISS_PENALTY;
                await client.query(`UPDATE users
           SET integrity_score = GREATEST(0, LEAST(100, integrity_score + $1))
           WHERE id = $2`, [delta, assignment.fury_user_id]);
                this.logger.log(`Fury ${assignment.fury_user_id}: honeypot verdict=${assignment.verdict}, ` +
                    `correct=${isCorrect}, integrity_delta=${delta}`);
            }
            await client.query('COMMIT');
            await this.truthLog.appendEvent('HONEYPOT_GRADED', {
                proofId,
                totalReviewers: assignments.rows.length,
                flaggedFuries,
                correctCount: assignments.rows.filter((a) => a.verdict === 'FAIL').length,
                incorrectCount: flaggedFuries.length,
            });
        }
        catch (err) {
            await client.query('ROLLBACK');
            this.logger.error(`Honeypot grading failed for proof ${proofId}: ${err.message}`);
            throw err;
        }
        finally {
            client.release();
        }
    }
};
exports.HoneypotService = HoneypotService;
HoneypotService.HONEYPOT_CORRECT_BONUS = 5;
HoneypotService.HONEYPOT_MISS_PENALTY = 5;
HoneypotService.MIN_FURIES_FOR_INJECTION = 3;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_6_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HoneypotService.prototype, "injectHoneypot", null);
exports.HoneypotService = HoneypotService = HoneypotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool,
        fury_router_service_1.FuryRouterService,
        truth_log_service_1.TruthLogService])
], HoneypotService);
//# sourceMappingURL=honeypot.service.js.map