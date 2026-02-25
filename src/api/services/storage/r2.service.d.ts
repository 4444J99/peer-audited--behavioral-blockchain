export declare class R2StorageService {
    private readonly s3Client;
    private readonly bucket;
    constructor();
    generateUploadUrl(proofId: string, contentType: string): Promise<{
        uploadUrl: string;
        key: string;
    }>;
    generateViewUrl(key: string): Promise<string>;
    downloadFile(key: string): Promise<Buffer>;
}
