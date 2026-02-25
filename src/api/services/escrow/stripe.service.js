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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeFboService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeFboService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
let StripeFboService = StripeFboService_1 = class StripeFboService {
    constructor() {
        this.logger = new common_1.Logger(StripeFboService_1.name);
        const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction && (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key')) {
            throw new Error('FATAL: STRIPE_SECRET_KEY is required in production. ' +
                'Set a valid Stripe secret key to prevent mock mode in production.');
        }
        this.stripe = new stripe_1.default(apiKey, {
            apiVersion: '2023-10-16',
        });
    }
    get isDevMode() {
        const key = process.env.STRIPE_SECRET_KEY;
        return !key || key === 'sk_test_mock_key';
    }
    async createCustomer(userId, email) {
        if (this.isDevMode) {
            const id = `cus_dev_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
            this.logger.debug(`[DEV] Created mock customer ${id}`);
            return id;
        }
        const customer = await this.stripe.customers.create({
            metadata: { styxUserId: userId },
            email,
        });
        return customer.id;
    }
    async holdStake(customerId, amountDollars, contractId) {
        if (this.isDevMode) {
            this.logger.debug(`[DEV] Mock hold $${amountDollars} for contract ${contractId}`);
            return {
                id: `pi_dev_${(0, crypto_1.randomUUID)().slice(0, 8)}`,
                status: 'requires_capture',
                amount: Math.round(amountDollars * 100),
                currency: 'usd',
            };
        }
        const intent = await this.stripe.paymentIntents.create({
            amount: Math.round(amountDollars * 100),
            currency: 'usd',
            customer: customerId,
            capture_method: 'manual',
            metadata: { contractId },
        });
        return intent;
    }
    async captureStake(paymentIntentId) {
        if (this.isDevMode) {
            this.logger.debug(`[DEV] Mock capture ${paymentIntentId}`);
            return { id: paymentIntentId, status: 'succeeded' };
        }
        return this.stripe.paymentIntents.capture(paymentIntentId);
    }
    async cancelHold(paymentIntentId) {
        if (this.isDevMode) {
            this.logger.debug(`[DEV] Mock cancel ${paymentIntentId}`);
            return { id: paymentIntentId, status: 'canceled' };
        }
        return this.stripe.paymentIntents.cancel(paymentIntentId);
    }
};
exports.StripeFboService = StripeFboService;
exports.StripeFboService = StripeFboService = StripeFboService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StripeFboService);
//# sourceMappingURL=stripe.service.js.map