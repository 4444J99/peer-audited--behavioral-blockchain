"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceService = void 0;
const common_1 = require("@nestjs/common");
const geofencing_1 = require("../geofencing");
let GeofenceService = class GeofenceService {
    lookupStateMOCK(ip) {
        if (ip.startsWith('192.168.1.'))
            return 'WA';
        if (ip.startsWith('10.0.0.'))
            return 'AR';
        if (ip.startsWith('172.16.'))
            return 'NY';
        return 'CA';
    }
    checkJurisdiction(ip) {
        const state = this.lookupStateMOCK(ip);
        const tier = geofencing_1.STATE_TIERS[state] || geofencing_1.JurisdictionTier.TIER_1;
        if (tier === geofencing_1.JurisdictionTier.TIER_3) {
            throw new common_1.ForbiddenException(`Jurisdiction Violation: IP address originates from a restricted 'Any Chance' region (${state}). Transactions are strictly prohibited.`);
        }
        return true;
    }
};
exports.GeofenceService = GeofenceService;
exports.GeofenceService = GeofenceService = __decorate([
    (0, common_1.Injectable)()
], GeofenceService);
//# sourceMappingURL=geofence.service.js.map