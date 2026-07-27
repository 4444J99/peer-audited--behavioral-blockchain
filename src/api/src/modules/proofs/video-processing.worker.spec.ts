import { VideoProcessingWorker } from "./video-processing.worker";

jest.mock("bullmq", () => {
  const mockWorker = jest.fn();
  return { Worker: mockWorker };
});

import { Pool } from "pg";

describe("VideoProcessingWorker", () => {
  let worker: VideoProcessingWorker;
  let mockPool: { query: jest.Mock };
  let mockTranscoding: {
    validateVideo: jest.Mock;
    transcode: jest.Mock;
  };
  let mockRedaction: {
    redact: jest.Mock;
    getProfileForContentType: jest.Mock;
  };
  let mockR2: {
    downloadFile: jest.Mock;
    uploadBuffer: jest.Mock;
  };

  beforeEach(() => {
    mockPool = { query: jest.fn() };
    mockTranscoding = {
      validateVideo: jest.fn(),
      transcode: jest.fn(),
    };
    mockRedaction = {
      redact: jest.fn(),
      getProfileForContentType: jest.fn().mockReturnValue("FACE_BLUR"),
    };
    mockR2 = {
      downloadFile: jest.fn(),
      uploadBuffer: jest.fn(),
    };
    worker = new VideoProcessingWorker(
      mockPool as any,
      mockTranscoding as any,
      mockRedaction as any,
      mockR2 as any,
    );
    jest.clearAllMocks();
  });

  describe("recordStage", () => {
    it("inserts a processing job record", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await (worker as any).recordStage("proof-1", "TRANSCODE", "COMPLETED");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO proof_processing_jobs"),
        ["proof-1", "TRANSCODE", "COMPLETED", null],
      );
    });

    it("records error message when provided", async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });

      await (worker as any).recordStage("proof-1", "VALIDATE", "FAILED", "Not a video");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO proof_processing_jobs"),
        ["proof-1", "VALIDATE", "FAILED", "Not a video"],
      );
    });

    it("does not throw if DB insert fails", async () => {
      mockPool.query.mockRejectedValue(new Error("DB down"));

      await expect(
        (worker as any).recordStage("proof-1", "STAGE", "DONE"),
      ).resolves.not.toThrow();
    });
  });
});
