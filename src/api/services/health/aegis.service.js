"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AegisProtocolService = void 0;
const common_1 = require("@nestjs/common");
let AegisProtocolService = class AegisProtocolService {
    validatePsychologicalGuardrails(stakeAmount, durationDays, integrityScore, pastFailures) {
        const MAX_STAKE_LIMIT = 500;
        const MIN_DURATION_DAYS = 7;
        if (stakeAmount > MAX_STAKE_LIMIT) {
            throw new common_1.HttpException(`Aegis Violation: Proposed stake ($${stakeAmount}) exceeds the absolute psychological safety ceiling of $${MAX_STAKE_LIMIT}. Contract rejected to prevent emotional self-harm.`, common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (durationDays < MIN_DURATION_DAYS) {
            throw new common_1.HttpException(`Aegis Violation: Proposed duration (${durationDays} days) is beneath the clinical threshold (${MIN_DURATION_DAYS} days) required to interrupt habituated neural pathways. Contract rejected.`, common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (pastFailures >= 3 && stakeAmount > 50) {
            throw new common_1.HttpException(`Aegis Velocity Check: After ${pastFailures} recent contract failures, your maximum allowed stake is strictly capped at $50 to prevent a financial downward spiral.`, common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (integrityScore < 40 && stakeAmount > 100) {
            throw new common_1.HttpException(`Aegis Integrity Check: A low Integrity Score (${integrityScore}) restricts stakes to a maximum of $100 until peer trust is rebuilt over time.`, common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        return true;
    }
};
exports.AegisProtocolService = AegisProtocolService;
exports.AegisProtocolService = AegisProtocolService = __decorate([
    (0, common_1.Injectable)()
], AegisProtocolService);
//# sourceMappingURL=aegis.service.js.map