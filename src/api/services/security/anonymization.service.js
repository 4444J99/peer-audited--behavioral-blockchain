"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymizationService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let AnonymizationService = class AnonymizationService {
    anonymizeUser(user) {
        if (!user)
            return null;
        const safeUser = { ...user };
        if (safeUser.email) {
            safeUser.email_hash = this.hash(safeUser.email);
            safeUser.email = '[REDACTED]';
        }
        if (safeUser.name) {
            safeUser.name = this.getInitials(safeUser.name);
        }
        if (safeUser.phone) {
            safeUser.phone = '[REDACTED]';
        }
        if (safeUser.stripe_customer_id) {
            delete safeUser.stripe_customer_id;
        }
        return safeUser;
    }
    hash(input) {
        return (0, crypto_1.createHash)('sha256').update(input.toLowerCase()).digest('hex');
    }
    getInitials(name) {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    }
};
exports.AnonymizationService = AnonymizationService;
exports.AnonymizationService = AnonymizationService = __decorate([
    (0, common_1.Injectable)()
], AnonymizationService);
//# sourceMappingURL=anonymization.service.js.map