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
var ConsumptionBillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumptionBillingService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let ConsumptionBillingService = ConsumptionBillingService_1 = class ConsumptionBillingService {
    constructor(pool) {
        this.pool = pool;
        this.logger = new common_1.Logger(ConsumptionBillingService_1.name);
    }
    async trackEvent(enterpriseId, eventType, units = 1) {
        this.logger.log(`[BILLING] Enterprise ${enterpriseId}: ${units}x ${eventType}`);
    }
    async getCurrentUsage(enterpriseId) {
        return {
            enterpriseId,
            billingPeriod: 'current',
            usage: {
                'AI_INSIGHTS': 142,
                'API_CALLS': 5430,
                'Active_Contracts': 12
            },
            estimatedCost: 245.50
        };
    }
};
exports.ConsumptionBillingService = ConsumptionBillingService;
exports.ConsumptionBillingService = ConsumptionBillingService = ConsumptionBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pg_1.Pool])
], ConsumptionBillingService);
//# sourceMappingURL=billing.service.js.map