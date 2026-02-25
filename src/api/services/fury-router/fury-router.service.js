"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuryRouterService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const queue_config_1 = require("../../config/queue.config");
let FuryRouterService = class FuryRouterService {
    onModuleInit() {
        this.queue = new bullmq_1.Queue(queue_config_1.FURY_ROUTER_QUEUE_NAME, (0, queue_config_1.getDefaultQueueOptions)());
    }
    setQueue(mockQueue) {
        this.queue = mockQueue;
    }
    async routeProof(proofId, submitterUserId, requiredReviewers = 3) {
        const jobData = {
            proofId,
            submitterUserId,
            requiredReviewers,
            dispatchedAt: new Date().toISOString()
        };
        const job = await this.queue.add('route-fury-review', jobData, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 }
        });
        return job.id ? job.id.toString() : 'fallback-job-id';
    }
};
exports.FuryRouterService = FuryRouterService;
exports.FuryRouterService = FuryRouterService = __decorate([
    (0, common_1.Injectable)()
], FuryRouterService);
//# sourceMappingURL=fury-router.service.js.map