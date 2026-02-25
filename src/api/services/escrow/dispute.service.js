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
var DisputeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const stripe_service_1 = require("./stripe.service");
const truth_log_service_1 = require("../ledger/truth-log.service");
const ledger_service_1 = require("../ledger/ledger.service");
const billing_1 = require("../billing");
let DisputeService = DisputeService_1 = class DisputeService {
    constructor(pool, stripeService, truthLog, ledger) {
        this.pool = pool;
        this.stripeService = stripeService;
        this.truthLog = truthLog;
        this.ledger = ledger;
        this.logger = new common_1.Logger(DisputeService_1.name);
    }
    async initiateAppeal(userId, proofId, customerId) {
        try {
            const holdResult = await this.stripeService.holdStake(customerId, billing_1.APPEAL_FEE_AMOUNT, proofId);
            await this.pool.query(`INSERT INTO disputes (proof_id, user_id, appeal_status, payment_intent_id, created_at)
         VALUES ($1, $2, 'FEE_AUTHORIZED_PENDING_REVIEW', $3, NOW())
         ON CONFLICT (proof_id) DO UPDATE SET
           appeal_status = 'FEE_AUTHORIZED_PENDING_REVIEW',
           payment_intent_id = $3`, [proofId, userId, holdResult.id]);
            await this.pool.query(`UPDATE proofs SET status = 'DISPUTED' WHERE id = $1`, [proofId]);
            await this.truthLog.appendEvent('APPEAL_INITIATED', {
                proofId,
                userId,
                amount: billing_1.APPEAL_FEE_AMOUNT,
                paymentIntentId: holdResult.id,
            });
            return {
                appealStatus: 'FEE_AUTHORIZED_PENDING_REVIEW',
                paymentIntentId: holdResult.id,
            };
        }
        catch (error) {
            throw new common_1.HttpException(`Appeal Rejected: Could not authorize the $${billing_1.APPEAL_FEE_AMOUNT} appeal fee. Reason: ${error.message}`, common_1.HttpStatus.PAYMENT_REQUIRED);
        }
    }
    async getDisputeQueue() {
        const result = await this.pool.query(`SELECT d.id, d.proof_id, d.user_id, d.appeal_status, d.judge_user_id, d.created_at,
              p.media_uri, p.status AS proof_status, p.content_type, p.submitted_at,
              u.email AS user_email,
              c.oath_category, c.id AS contract_id
       FROM disputes d
       JOIN proofs p ON d.proof_id = p.id
       JOIN users u ON d.user_id = u.id
       JOIN contracts c ON p.contract_id = c.id
       WHERE d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')
       ORDER BY d.created_at ASC`);
        return result.rows;
    }
    async getDisputeDetail(disputeId) {
        const dispute = await this.pool.query(`SELECT d.id, d.proof_id, d.user_id, d.appeal_status, d.judge_user_id,
              d.judge_notes, d.resolved_at,
              p.media_uri, p.status AS proof_status, p.submitted_at, p.content_type,
              u.email AS user_email,
              c.oath_category, c.id AS contract_id
       FROM disputes d
       JOIN proofs p ON d.proof_id = p.id
       JOIN users u ON d.user_id = u.id
       JOIN contracts c ON p.contract_id = c.id
       WHERE d.id = $1`, [disputeId]);
        if (dispute.rows.length === 0) {
            throw new common_1.NotFoundException('Dispute not found');
        }
        const row = dispute.rows[0];
        const votes = await this.pool.query(`SELECT fury_user_id, verdict, reviewed_at
       FROM fury_assignments
       WHERE proof_id = $1 AND verdict IS NOT NULL
       ORDER BY reviewed_at ASC`, [row.proof_id]);
        return {
            id: row.id,
            proofId: row.proof_id,
            contractId: row.contract_id,
            userId: row.user_id,
            userEmail: row.user_email,
            oathCategory: row.oath_category,
            proofStatus: row.proof_status,
            mediaUri: row.media_uri,
            submittedAt: row.submitted_at,
            appealStatus: row.appeal_status,
            judgeUserId: row.judge_user_id,
            judgeNotes: row.judge_notes,
            resolvedAt: row.resolved_at,
            furyVotes: votes.rows,
        };
    }
    async resolveDispute(disputeId, judgeUserId, outcome, judgeNotes) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const dispute = await client.query(`SELECT d.id, d.proof_id, d.user_id, d.payment_intent_id,
                p.contract_id
         FROM disputes d
         JOIN proofs p ON d.proof_id = p.id
         WHERE d.id = $1 AND d.appeal_status IN ('FEE_AUTHORIZED_PENDING_REVIEW', 'IN_REVIEW')`, [disputeId]);
            if (dispute.rows.length === 0) {
                throw new common_1.NotFoundException('Dispute not found or already resolved');
            }
            const { proof_id, user_id, payment_intent_id, contract_id } = dispute.rows[0];
            let appealStatus;
            let proofStatus;
            switch (outcome) {
                case 'UPHELD':
                    appealStatus = 'RESOLVED_UPHELD';
                    proofStatus = 'REJECTED';
                    try {
                        await this.stripeService.captureStake(payment_intent_id);
                    }
                    catch {
                    }
                    break;
                case 'OVERTURNED':
                    appealStatus = 'RESOLVED_OVERTURNED';
                    proofStatus = 'VERIFIED';
                    try {
                        await this.stripeService.cancelHold(payment_intent_id);
                    }
                    catch {
                    }
                    await client.query(`UPDATE users
             SET integrity_score = GREATEST(0, integrity_score - 10)
             WHERE id IN (
               SELECT fury_user_id FROM fury_assignments
               WHERE proof_id = $1 AND verdict = 'FAIL'
             )`, [proof_id]);
                    break;
                case 'ESCALATED':
                    appealStatus = 'ESCALATED';
                    proofStatus = 'DISPUTED';
                    break;
            }
            await client.query(`UPDATE disputes
         SET appeal_status = $1, judge_user_id = $2, judge_notes = $3, resolved_at = NOW()
         WHERE id = $4`, [appealStatus, judgeUserId, judgeNotes, disputeId]);
            await client.query(`UPDATE proofs SET status = $1 WHERE id = $2`, [proofStatus, proof_id]);
            await client.query('COMMIT');
            await this.truthLog.appendEvent('DISPUTE_RESOLVED', {
                disputeId,
                proofId: proof_id,
                userId: user_id,
                judgeUserId,
                outcome,
                judgeNotes,
                contractId: contract_id,
            });
            this.logger.log(`Dispute ${disputeId} resolved: ${outcome} by judge ${judgeUserId}`);
            return { status: appealStatus };
        }
        catch (err) {
            await client.query('ROLLBACK');
            if (err instanceof common_1.NotFoundException)
                throw err;
            this.logger.error(`Dispute resolution failed: ${err.message}`);
            throw err;
        }
        finally {
            client.release();
        }
    }
};
exports.DisputeService = DisputeService;
exports.DisputeService = DisputeService = DisputeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool,
        stripe_service_1.StripeFboService,
        truth_log_service_1.TruthLogService,
        ledger_service_1.LedgerService])
], DisputeService);
//# sourceMappingURL=dispute.service.js.map