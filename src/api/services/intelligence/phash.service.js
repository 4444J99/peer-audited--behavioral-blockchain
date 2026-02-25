"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHashService = void 0;
const common_1 = require("@nestjs/common");
const sharp_1 = __importDefault(require("sharp"));
let PHashService = class PHashService {
    constructor() {
        this.HASH_SIZE = 8;
        this.HAMMING_THRESHOLD = 10;
    }
    async computeFrameHash(frameBuffer) {
        const { data } = await (0, sharp_1.default)(frameBuffer)
            .resize(this.HASH_SIZE, this.HASH_SIZE, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const pixels = Array.from(data);
        const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;
        const bits = pixels.map((p) => (p >= avg ? '1' : '0')).join('');
        return BigInt('0b' + bits).toString(16).padStart(16, '0');
    }
    hammingDistance(hash1, hash2) {
        const a = BigInt('0x' + hash1);
        const b = BigInt('0x' + hash2);
        let xor = a ^ b;
        let dist = 0;
        while (xor > 0n) {
            dist += Number(xor & 1n);
            xor >>= 1n;
        }
        return dist;
    }
    async isDuplicate(frameBuffer, existingHashes) {
        const newHash = await this.computeFrameHash(frameBuffer);
        let closestDistance = Infinity;
        for (const existing of existingHashes) {
            const dist = this.hammingDistance(newHash, existing);
            closestDistance = Math.min(closestDistance, dist);
            if (dist < this.HAMMING_THRESHOLD) {
                return { duplicate: true, closestDistance: dist };
            }
        }
        return { duplicate: false, closestDistance };
    }
    async extractFrameHashes(videoFrames) {
        return Promise.all(videoFrames.map((frame) => this.computeFrameHash(frame)));
    }
};
exports.PHashService = PHashService;
exports.PHashService = PHashService = __decorate([
    (0, common_1.Injectable)()
], PHashService);
//# sourceMappingURL=phash.service.js.map