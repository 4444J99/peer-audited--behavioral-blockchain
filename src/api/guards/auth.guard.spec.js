"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const auth_guard_1 = require("./auth.guard");
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const DEV_SECRET = 'styx-dev-secret-do-not-use-in-production';
function createMockContext(authHeader) {
    const request = {
        headers: {
            authorization: authHeader,
        },
    };
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
    };
}
describe('AuthGuard', () => {
    let guard;
    beforeEach(() => {
        guard = new auth_guard_1.AuthGuard();
    });
    it('should reject requests with no Authorization header', () => {
        const context = createMockContext(undefined);
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should reject requests with empty Bearer token', () => {
        const context = createMockContext('Bearer ');
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should reject requests with invalid token', () => {
        const context = createMockContext('Bearer invalid-garbage-token');
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should NOT accept any hardcoded dev mock token', () => {
        const context = createMockContext('Bearer dev-mock-jwt-token-alpha-omega');
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should accept a valid JWT and attach user from payload', () => {
        const token = jwt.sign({ sub: 'user-uuid-123', email: 'alice@styx.protocol' }, DEV_SECRET, { expiresIn: '1h' });
        const context = createMockContext(`Bearer ${token}`);
        const result = guard.canActivate(context);
        expect(result).toBe(true);
        const request = context.switchToHttp().getRequest();
        expect(request.user.id).toBe('user-uuid-123');
        expect(request.user.email).toBe('alice@styx.protocol');
    });
    it('should reject an expired JWT', () => {
        const token = jwt.sign({ sub: 'user-uuid-123', email: 'alice@styx.protocol' }, DEV_SECRET, { expiresIn: '-1s' });
        const context = createMockContext(`Bearer ${token}`);
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should reject a JWT signed with wrong secret', () => {
        const token = jwt.sign({ sub: 'user-uuid-123', email: 'alice@styx.protocol' }, 'wrong-secret-key', { expiresIn: '1h' });
        const context = createMockContext(`Bearer ${token}`);
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should reject non-Bearer auth schemes', () => {
        const context = createMockContext('Basic dXNlcjpwYXNz');
        expect(() => guard.canActivate(context)).toThrow(common_1.UnauthorizedException);
    });
    it('should throw in production if JWT_SECRET is not set', () => {
        const originalEnv = process.env.NODE_ENV;
        const originalSecret = process.env.JWT_SECRET;
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        const token = jwt.sign({ sub: 'user-uuid-123', email: 'alice@styx.protocol' }, 'any-secret', { expiresIn: '1h' });
        const context = createMockContext(`Bearer ${token}`);
        expect(() => guard.canActivate(context)).toThrow('JWT_SECRET must be set in production');
        process.env.NODE_ENV = originalEnv;
        if (originalSecret)
            process.env.JWT_SECRET = originalSecret;
    });
});
//# sourceMappingURL=auth.guard.spec.js.map