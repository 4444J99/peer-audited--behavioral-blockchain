import { CrisisDetectionService } from "./crisis-detection.service";

describe("CrisisDetectionService", () => {
  let service: CrisisDetectionService;

  beforeEach(() => {
    service = new CrisisDetectionService();
  });

  it("should detect critical patterns and classify as CRITICAL", () => {
    const result = service.analyzeContent("I just want to kill myself");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe("CRITICAL");
    expect(result.matchedKeywords).toContain("kill myself");
  });

  it("should detect high patterns and classify as HIGH", () => {
    const result = service.analyzeContent("I want to starve myself");
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe("HIGH");
    expect(result.matchedKeywords).toContain("starve");
  });

  it("should return NONE for safe content (false positive prevention)", () => {
    const result = service.analyzeContent(
      "I killed my workout today! I want to dye my hair.",
    );
    expect(result.isCrisis).toBe(false);
    expect(result.severity).toBe("NONE");
    expect(result.matchedKeywords.length).toBe(0);
  });

  it("should be case insensitive", () => {
    const result = service.analyzeContent(
      "SUICIDE is not an option but I feel like it",
    );
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe("CRITICAL");
    expect(result.matchedKeywords).toContain("suicide");
  });

  it("should escalate to CRITICAL if both HIGH and CRITICAL patterns exist", () => {
    const result = service.analyzeContent(
      "I am so drunk and want to end it all",
    );
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe("CRITICAL");
    expect(result.matchedKeywords).toContain("end it all");
  });
});
