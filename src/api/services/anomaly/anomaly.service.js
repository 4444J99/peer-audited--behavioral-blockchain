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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AnomalyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyService = exports.ANOMALY_REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const sharp_1 = __importDefault(require("sharp"));
const ioredis_1 = __importDefault(require("ioredis"));
const PHASH_HAMMING_THRESHOLD = 5;
const EXIF_DISCREPANCY_HOURS = 1;
const ANALYSIS_TIMEOUT_MS = 10_000;
const HASH_TTL_SECONDS = 30 * 24 * 60 * 60;
exports.ANOMALY_REDIS_CLIENT = 'ANOMALY_REDIS_CLIENT';
let AnomalyService = AnomalyService_1 = class AnomalyService {
    constructor(redis) {
        this.redis = redis;
        this.logger = new common_1.Logger(AnomalyService_1.name);
        this.memoryStore = new Map();
        this.nextId = 0;
    }
    async analyze(mediaUri, userId) {
        const flags = [];
        try {
            const result = await Promise.race([
                this.runAnalysis(mediaUri, userId, flags),
                this.timeout(ANALYSIS_TIMEOUT_MS),
            ]);
            return result;
        }
        catch (err) {
            this.logger.warn(`Anomaly analysis timed out for ${mediaUri}, failing open`);
            return { rejected: false, flags: ['ANALYSIS_TIMEOUT', 'UNVERIFIED'] };
        }
    }
    async runAnalysis(mediaUri, userId, flags) {
        const pHash = this.computePHash(mediaUri);
        const duplicate = await this.checkDuplicate(pHash);
        if (duplicate) {
            return {
                rejected: true,
                reason: `Duplicate media detected (Hamming distance < ${PHASH_HAMMING_THRESHOLD}). Original: ${duplicate.mediaUri}`,
                flags: ['PHASH_DUPLICATE'],
            };
        }
        await this.storeHash(pHash, userId, mediaUri);
        const exifFlag = await this.checkExifTimestamp(mediaUri);
        if (exifFlag) {
            flags.push('EXIF_TIMESTAMP_DISCREPANCY');
        }
        return { rejected: false, flags };
    }
    computePHash(mediaUri) {
        let hash = 0n;
        for (let i = 0; i < mediaUri.length; i++) {
            hash = ((hash << 5n) - hash + BigInt(mediaUri.charCodeAt(i))) & 0xffffffffffffffffn;
        }
        return hash.toString(16).padStart(16, '0');
    }
    hammingDistance(a, b) {
        let distance = 0;
        const aBig = BigInt('0x' + a);
        const bBig = BigInt('0x' + b);
        let xor = aBig ^ bBig;
        while (xor > 0n) {
            distance += Number(xor & 1n);
            xor >>= 1n;
        }
        return distance;
    }
    async checkDuplicate(pHash) {
        if (this.redis) {
            return this.checkDuplicateRedis(pHash);
        }
        return this.checkDuplicateMemory(pHash);
    }
    async checkDuplicateRedis(pHash) {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'anomaly:phash:*', 'COUNT', 100);
            cursor = nextCursor;
            for (const key of keys) {
                const entries = await this.redis.lrange(key, 0, -1);
                for (const raw of entries) {
                    const entry = JSON.parse(raw);
                    const distance = this.hammingDistance(pHash, entry.hash);
                    if (distance < PHASH_HAMMING_THRESHOLD) {
                        return { mediaUri: entry.mediaUri };
                    }
                }
            }
        } while (cursor !== '0');
        return null;
    }
    checkDuplicateMemory(pHash) {
        for (const [, entries] of this.memoryStore) {
            for (const entry of entries) {
                const distance = this.hammingDistance(pHash, entry.hash);
                if (distance < PHASH_HAMMING_THRESHOLD) {
                    return { mediaUri: entry.mediaUri };
                }
            }
        }
        return null;
    }
    async storeHash(pHash, userId, mediaUri) {
        if (this.redis) {
            const key = `anomaly:phash:${userId}`;
            const entry = JSON.stringify({ hash: pHash, userId, mediaUri });
            await this.redis.rpush(key, entry);
            await this.redis.expire(key, HASH_TTL_SECONDS);
            return;
        }
        const entries = this.memoryStore.get(userId) || [];
        entries.push({ hash: pHash, userId, mediaUri, id: this.nextId++ });
        this.memoryStore.set(userId, entries);
    }
    async checkExifTimestamp(mediaUri) {
        try {
            if (!mediaUri || mediaUri.startsWith('http')) {
                return false;
            }
            const metadata = await (0, sharp_1.default)(mediaUri).metadata();
            const exifBuffer = metadata.exif;
            if (!exifBuffer)
                return false;
            const exifDateMatch = exifBuffer.toString('binary').match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
            if (!exifDateMatch)
                return false;
            const [, year, month, day, hour, minute, second] = exifDateMatch;
            const exifDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
            if (isNaN(exifDate.getTime()))
                return false;
            const now = new Date();
            const diffHours = Math.abs(now.getTime() - exifDate.getTime()) / (1000 * 60 * 60);
            if (diffHours > EXIF_DISCREPANCY_HOURS) {
                this.logger.warn(`EXIF timestamp discrepancy: ${diffHours.toFixed(1)}h for ${mediaUri}`);
                return true;
            }
            return false;
        }
        catch (err) {
            this.logger.debug(`EXIF check skipped for ${mediaUri}: ${err.message}`);
            return false;
        }
    }
    timeout(ms) {
        return new Promise((_, reject) => setTimeout(() => reject(new Error('Analysis timeout')), ms));
    }
};
exports.AnomalyService = AnomalyService;
exports.AnomalyService = AnomalyService = AnomalyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(exports.ANOMALY_REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], AnomalyService);
//# sourceMappingURL=anomaly.service.js.map