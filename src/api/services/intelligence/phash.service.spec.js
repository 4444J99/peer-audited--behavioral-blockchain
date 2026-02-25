"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phash_service_1 = require("./phash.service");
jest.mock('sharp', () => {
    return jest.fn().mockImplementation(() => ({
        resize: jest.fn().mockReturnThis(),
        grayscale: jest.fn().mockReturnThis(),
        raw: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
            data: Buffer.from(new Array(64).fill(0).map((_, i) => (i < 32 ? 200 : 50))),
            info: { width: 8, height: 8, channels: 1 },
        }),
    }));
});
describe('PHashService', () => {
    let service;
    beforeEach(() => {
        service = new phash_service_1.PHashService();
    });
    describe('computeFrameHash', () => {
        it('should return a 16-char hex string', async () => {
            const hash = await service.computeFrameHash(Buffer.from('test'));
            expect(hash).toMatch(/^[0-9a-f]{16}$/);
        });
    });
    describe('hammingDistance', () => {
        it('should return 0 for identical hashes', () => {
            expect(service.hammingDistance('ffffffff00000000', 'ffffffff00000000')).toBe(0);
        });
        it('should return correct distance for different hashes', () => {
            expect(service.hammingDistance('0000000000000000', '0000000000000001')).toBe(1);
        });
        it('should be symmetric', () => {
            const d1 = service.hammingDistance('aaaa000000000000', 'bbbb000000000000');
            const d2 = service.hammingDistance('bbbb000000000000', 'aaaa000000000000');
            expect(d1).toBe(d2);
        });
    });
    describe('isDuplicate', () => {
        it('should detect duplicate frames', async () => {
            const hash = await service.computeFrameHash(Buffer.from('test'));
            const result = await service.isDuplicate(Buffer.from('test'), [hash]);
            expect(result.duplicate).toBe(true);
            expect(result.closestDistance).toBe(0);
        });
        it('should not flag unique frames', async () => {
            const result = await service.isDuplicate(Buffer.from('test'), ['ffffffffffffffff']);
            expect(result.duplicate).toBe(false);
        });
        it('should return Infinity closestDistance for empty existing hashes', async () => {
            const result = await service.isDuplicate(Buffer.from('test'), []);
            expect(result.duplicate).toBe(false);
            expect(result.closestDistance).toBe(Infinity);
        });
    });
    describe('extractFrameHashes', () => {
        it('should return hashes for all frames', async () => {
            const frames = [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')];
            const hashes = await service.extractFrameHashes(frames);
            expect(hashes).toHaveLength(3);
            hashes.forEach((hash) => {
                expect(hash).toMatch(/^[0-9a-f]{16}$/);
            });
        });
    });
});
//# sourceMappingURL=phash.service.spec.js.map