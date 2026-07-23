import { RedactionService } from "./redaction.service";

jest.mock("child_process", () => ({
  execFile: jest.fn(),
}));

import { execFile } from "child_process";

const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;

describe("RedactionService", () => {
  let service: RedactionService;

  beforeEach(() => {
    service = new RedactionService();
    jest.clearAllMocks();
  });

  describe("getProfileForContentType", () => {
    it("returns FACE_BLUR for video types", () => {
      expect(service.getProfileForContentType("video/mp4")).toBe("FACE_BLUR");
      expect(service.getProfileForContentType("video/quicktime")).toBe("FACE_BLUR");
    });

    it("returns VOICE_PIVOT for audio types", () => {
      expect(service.getProfileForContentType("audio/m4a")).toBe("VOICE_PIVOT");
      expect(service.getProfileForContentType("audio/wav")).toBe("VOICE_PIVOT");
    });

    it("defaults to FACE_BLUR for unknown types", () => {
      expect(service.getProfileForContentType("image/jpeg")).toBe("FACE_BLUR");
    });
  });

  describe("redact", () => {
    it("throws on unknown profile", async () => {
      await expect(
        service.redact(Buffer.from("fake"), "UNKNOWN" as any, "video/mp4"),
      ).rejects.toThrow("Unknown redaction profile");
    });
  });
});
