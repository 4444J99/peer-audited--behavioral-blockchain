export declare class PHashService {
    private readonly HASH_SIZE;
    private readonly HAMMING_THRESHOLD;
    computeFrameHash(frameBuffer: Buffer): Promise<string>;
    hammingDistance(hash1: string, hash2: string): number;
    isDuplicate(frameBuffer: Buffer, existingHashes: string[]): Promise<{
        duplicate: boolean;
        closestDistance: number;
    }>;
    extractFrameHashes(videoFrames: Buffer[]): Promise<string[]>;
}
