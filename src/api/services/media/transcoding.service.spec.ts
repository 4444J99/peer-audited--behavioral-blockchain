import { TranscodingService } from "./transcoding.service";

// Mock child_process.execFile to avoid requiring FFmpeg in CI
jest.mock("child_process", () => ({
  execFile: jest.fn(),
}));

import { execFile } from "child_process";

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

describe("TranscodingService", () => {
  let service: TranscodingService;

  beforeEach(() => {
    service = new TranscodingService();
    jest.clearAllMocks();
  });

  describe("extractMetadata", () => {
    it("parses ffprobe JSON output into VideoMetadata", async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          duration: "12.5",
          bit_rate: "2500000",
          size: "3906250",
        },
        streams: [
          {
            codec_type: "video",
            codec_name: "h264",
            width: 1920,
            height: 1080,
            r_frame_rate: "30/1",
          },
        ],
      });

      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        (cb as any)(null, { stdout: ffprobeOutput, stderr: "" });
        return {} as any;
      });

      const metadata = await service.extractMetadata("/tmp/test.mp4");

      expect(metadata.duration).toBe(12.5);
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
      expect(metadata.codec).toBe("h264");
      expect(metadata.fps).toBe(30);
      expect(metadata.bitrate).toBe(2500000);
      expect(metadata.size).toBe(3906250);
    });

    it("handles missing streams gracefully", async () => {
      const ffprobeOutput = JSON.stringify({
        format: { duration: "5.0", bit_rate: "1000000", size: "625000" },
        streams: [],
      });

      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        (cb as any)(null, { stdout: ffprobeOutput, stderr: "" });
        return {} as any;
      });

      const metadata = await service.extractMetadata("/tmp/test.mp4");

      expect(metadata.codec).toBe("unknown");
      expect(metadata.width).toBe(0);
      expect(metadata.height).toBe(0);
    });
  });

  describe("validateVideo", () => {
    it("returns true for valid video", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        (cb as any)(null, { stdout: "mp4\n", stderr: "" });
        return {} as any;
      });

      const result = await service.validateVideo(Buffer.from("fake"), "video/mp4");
      expect(result).toBe(true);
    });

    it("returns false for invalid video", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
        (cb as any)(new Error("Invalid data"), { stdout: "", stderr: "error" });
        return {} as any;
      });

      const result = await service.validateVideo(Buffer.from("fake"), "video/mp4");
      expect(result).toBe(false);
    });
  });
});
