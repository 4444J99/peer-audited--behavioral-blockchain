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
var FuryRouterWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuryRouterWorker = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const pg_1 = require("pg");
const queue_config_1 = require("../../config/queue.config");
let FuryRouterWorker = FuryRouterWorker_1 = class FuryRouterWorker {
    constructor(pool) {
        this.pool = pool;
        this.logger = new common_1.Logger(FuryRouterWorker_1.name);
    }
    onModuleInit() {
        const queueOptions = (0, queue_config_1.getDefaultQueueOptions)();
        this.worker = new bullmq_1.Worker(queue_config_1.FURY_ROUTER_QUEUE_NAME, async (job) => {
            await this.processJob(job);
        }, {
            connection: queueOptions.connection,
            concurrency: 5,
            limiter: {
                max: 100,
                duration: 60_000,
            },
        });
        this.worker.on('completed', (job) => {
            this.logger.log(`Fury routing completed for proof ${job.data.proofId}`);
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`Fury routing failed for proof ${job?.data?.proofId}: ${err.message}`);
        });
        this.logger.log('FuryRouterWorker initialized and listening for jobs');
    }
    async processJob(job) {
        const { proofId, submitterUserId, requiredReviewers } = job.data;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const eligibleResult = await client.query(`SELECT id FROM users
         WHERE id != $1
           AND status = 'ACTIVE'
           AND role IN ('USER', 'FURY', 'ADMIN')
           AND integrity_score >= 20
         ORDER BY RANDOM()
         LIMIT $2`, [submitterUserId, requiredReviewers]);
            const selectedFuries = eligibleResult.rows;
            if (selectedFuries.length < requiredReviewers) {
                this.logger.warn(`Only ${selectedFuries.length}/${requiredReviewers} eligible Furies found for proof ${proofId}. Proceeding with available reviewers.`);
            }
            if (selectedFuries.length === 0) {
                throw new Error(`No eligible Furies available for proof ${proofId}`);
            }
            for (const fury of selectedFuries) {
                await client.query(`INSERT INTO fury_assignments (proof_id, fury_user_id)
           VALUES ($1, $2)`, [proofId, fury.id]);
            }
            await client.query(`UPDATE proofs SET status = 'UNDER_REVIEW' WHERE id = $1`, [proofId]);
            await client.query('COMMIT');
            this.logger.log(`Routed proof ${proofId} to ${selectedFuries.length} Furies: [${selectedFuries.map((f) => f.id).join(', ')}]`);
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
};
exports.FuryRouterWorker = FuryRouterWorker;
exports.FuryRouterWorker = FuryRouterWorker = FuryRouterWorker_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool])
], FuryRouterWorker);
//# sourceMappingURL=fury-router.worker.js.map