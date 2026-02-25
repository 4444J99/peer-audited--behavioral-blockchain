"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryProtocolService = void 0;
const common_1 = require("@nestjs/common");
const behavioral_logic_1 = require("../../../shared/libs/behavioral-logic");
let RecoveryProtocolService = class RecoveryProtocolService {
    validateRecoveryContract(oathCategory, durationDays, metadata) {
        if (!metadata) {
            throw new common_1.HttpException('Recovery contracts require accountability partner and safety acknowledgments.', common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (!metadata.accountabilityPartnerEmail || metadata.accountabilityPartnerEmail.trim() === '') {
            throw new common_1.HttpException('Recovery Protocol: An accountability partner email is required for all recovery contracts.', common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (durationDays > behavioral_logic_1.MAX_NOCONTACT_DURATION_DAYS) {
            throw new common_1.HttpException(`Recovery Protocol: Maximum contract duration is ${behavioral_logic_1.MAX_NOCONTACT_DURATION_DAYS} days. Longer commitments require renewal to ensure ongoing well-being.`, common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        if (oathCategory === 'RECOVERY_NOCONTACT') {
            if (!metadata.noContactIdentifiers || metadata.noContactIdentifiers.length === 0) {
                throw new common_1.HttpException('Recovery Protocol: At least one no-contact identifier is required.', common_1.HttpStatus.NOT_ACCEPTABLE);
            }
            if (metadata.noContactIdentifiers.length > behavioral_logic_1.MAX_NOCONTACT_TARGETS) {
                throw new common_1.HttpException(`Recovery Protocol: Maximum ${behavioral_logic_1.MAX_NOCONTACT_TARGETS} no-contact targets per contract to prevent isolation.`, common_1.HttpStatus.NOT_ACCEPTABLE);
            }
        }
        const acks = metadata.acknowledgments;
        if (!acks || !acks.voluntary || !acks.noMinors || !acks.noDependents || !acks.noLegalObligations) {
            throw new common_1.HttpException('Recovery Protocol: All safety acknowledgments must be confirmed before contract creation.', common_1.HttpStatus.NOT_ACCEPTABLE);
        }
        return true;
    }
};
exports.RecoveryProtocolService = RecoveryProtocolService;
exports.RecoveryProtocolService = RecoveryProtocolService = __decorate([
    (0, common_1.Injectable)()
], RecoveryProtocolService);
//# sourceMappingURL=recovery-protocol.service.js.map