"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CrmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
let CrmService = CrmService_1 = class CrmService {
    constructor() {
        this.logger = new common_1.Logger(CrmService_1.name);
    }
    async syncUser(user) {
        this.logger.log(`[CRM_SYNC] Syncing user ${user.email} to external CRM...`);
        await new Promise(resolve => setTimeout(resolve, 50));
        this.logger.log(`[CRM_SYNC] User ${user.email} synced successfully.`);
    }
    async logInteraction(email, type, metadata) {
        this.logger.log(`[CRM_INTERACTION] ${email} - ${type}: ${JSON.stringify(metadata)}`);
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = CrmService_1 = __decorate([
    (0, common_1.Injectable)()
], CrmService);
//# sourceMappingURL=crm.service.js.map