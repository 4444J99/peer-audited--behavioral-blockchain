import { CrisisDetectionService } from "./crisis-detection.service";

describe("CrisisDetectionService", () => {
  let service: CrisisDetectionService;

  beforeEach(() => {
    service = new CrisisDetectionService();
  });

  describe("true positives — CRITICAL patterns", () => {
    it("detects 'kill myself'", () => {
      const r = service.analyzeContent("I want to kill myself");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords).toContain("kill myself");
    });

    it("detects 'suicide'", () => {
      const r = service.analyzeContent("I am thinking about suicide");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords).toContain("suicide");
    });

    it("detects 'end it all'", () => {
      const r = service.analyzeContent("I just want to end it all");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords).toContain("end it all");
    });

    it("detects 'want to die'", () => {
      const r = service.analyzeContent("I want to die");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords).toContain("want to die");
    });

    it("detects 'take my own life'", () => {
      const r = service.analyzeContent("I want to take my own life");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords).toContain("take my own life");
    });
  });

  describe("true positives — HIGH patterns", () => {
    it("detects 'starve'", () => {
      const r = service.analyzeContent("I want to starve myself");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("starve");
    });

    it("detects 'purge'", () => {
      const r = service.analyzeContent("I need to purge");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("purge");
    });

    it("detects 'anorexia'", () => {
      const r = service.analyzeContent("My anorexia is getting worse");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("anorexia");
    });

    it("detects 'bulimia'", () => {
      const r = service.analyzeContent("Bulimia has taken over my life");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("bulimia");
    });

    it("detects 'cutting myself'", () => {
      const r = service.analyzeContent("I keep cutting myself");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("cutting myself");
    });

    it("detects 'self harm' (with hyphen)", () => {
      const r = service.analyzeContent("I am struggling with self-harm");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("self-harm");
    });

    it("detects 'self harm' (with space)", () => {
      const r = service.analyzeContent("I am doing self harm again");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("self harm");
    });

    it("detects 'relapse'", () => {
      const r = service.analyzeContent("I am about to relapse");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("relapse");
    });

    it("detects 'using again'", () => {
      const r = service.analyzeContent("I started using again");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("using again");
    });

    it("detects 'drunk'", () => {
      const r = service.analyzeContent("I got really drunk last night again");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("drunk");
    });

    it("detects 'high right now'", () => {
      const r = service.analyzeContent("I am high right now and I hate it");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("high right now");
    });

    it("detects 'drinking again'", () => {
      const r = service.analyzeContent("I started drinking again");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("HIGH");
      expect(r.matchedKeywords).toContain("drinking again");
    });
  });

  describe("false positive prevention — safe content", () => {
    it("does not flag 'I killed my workout'", () => {
      const r = service.analyzeContent("I killed my workout today");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'I want to dye my hair'", () => {
      const r = service.analyzeContent("I want to dye my hair pink");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'That idea is killer'", () => {
      const r = service.analyzeContent("That idea is killer");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'This soup is to die for'", () => {
      const r = service.analyzeContent("This soup is to die for");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'I could die laughing'", () => {
      const r = service.analyzeContent("I could die laughing at that video");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag benign compound words containing 'die'", () => {
      const r = service.analyzeContent("This is a dietary concern");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag benign compound words containing 'cut'", () => {
      const r = service.analyzeContent("I need a haircut");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag everyday gym talk", () => {
      const r = service.analyzeContent("Really pushed myself at the gym today");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'This is killing me' (idiom)", () => {
      const r = service.analyzeContent("This humidity is killing me");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'end the meeting' (phrasal similarity)", () => {
      const r = service.analyzeContent("Let's end the meeting here");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'drink water'", () => {
      const r = service.analyzeContent("I need to drink more water");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'high five'", () => {
      const r = service.analyzeContent("Give me a high five");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag 'starving' in food context", () => {
      const r = service.analyzeContent("I am starving, let's get lunch");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("does not flag generic 'taking my own path'", () => {
      const r = service.analyzeContent("I want to take my own path in life");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });
  });

  describe("edge cases", () => {
    it("returns NONE for empty string", () => {
      const r = service.analyzeContent("");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("returns NONE for null or undefined", () => {
      const r = service.analyzeContent(null as unknown as string);
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("returns NONE for whitespace-only", () => {
      const r = service.analyzeContent("   ");
      expect(r.isCrisis).toBe(false);
      expect(r.severity).toBe("NONE");
    });

    it("handles very long strings without error", () => {
      const longPrefix = "A".repeat(10000);
      const r = service.analyzeContent(
        longPrefix + " I want to kill myself " + "B".repeat(10000),
      );
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles strings with special characters and punctuation", () => {
      const r = service.analyzeContent("I want to kill myself!!!");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles content with embedded URLs", () => {
      const r = service.analyzeContent(
        "Read this https://example.com/suicide-help I want to die",
      );
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles content with HTML tags", () => {
      const r = service.analyzeContent("<p>I want to kill myself</p>");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("detects patterns with punctuation between words", () => {
      const r = service.analyzeContent("I want to... kill... myself...");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords[0]).toContain("kill");
      expect(r.matchedKeywords[0]).toContain("myself");
    });

    it("detects patterns across newlines", () => {
      const r = service.analyzeContent("I just want\nto kill myself");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles repeated patterns (deduplication)", () => {
      const r = service.analyzeContent("suicide suicide suicide");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords.length).toBeGreaterThanOrEqual(1);
    });

    it("handles unicode and non-ASCII before patterns", () => {
      const r = service.analyzeContent(
        "Je veux me suicider — I want to kill myself",
      );
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });
  });

  describe("severity escalation — CRITICAL overrides HIGH", () => {
    it("escalates to CRITICAL when both HIGH and CRITICAL patterns exist", () => {
      const r = service.analyzeContent("I am drunk and want to end it all");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("escalates to CRITICAL even when HIGH pattern appears first", () => {
      const r = service.analyzeContent(
        "I relapsed and now I want to kill myself",
      );
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("captures both HIGH and CRITICAL keywords", () => {
      const r = service.analyzeContent(
        "I feel like cutting myself and taking my own life",
      );
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
      expect(r.matchedKeywords[0]).toContain("taking my own life");
    });
  });

  describe("case insensitivity", () => {
    it("handles UPPERCASE", () => {
      const r = service.analyzeContent("SUICIDE IS ON MY MIND");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles Title Case", () => {
      const r = service.analyzeContent("Thinking About Suicide Again");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });

    it("handles mixed case", () => {
      const r = service.analyzeContent("I Want To Kill Myself");
      expect(r.isCrisis).toBe(true);
      expect(r.severity).toBe("CRITICAL");
    });
  });

  describe("critical detection accuracy metrics", () => {
    it("zero false negatives for all known CRITICAL patterns", () => {
      const criticalInputs = [
        "kill myself",
        "suicide",
        "end it all",
        "want to die",
        "take my own life",
      ];
      for (const input of criticalInputs) {
        const r = service.analyzeContent(input);
        expect(r.isCrisis).toBe(true);
        expect(r.severity).toBe("CRITICAL");
      }
    });

    it("zero false negatives for all known HIGH patterns", () => {
      const highInputs = [
        "starve",
        "purge",
        "anorexia",
        "bulimia",
        "cutting myself",
        "self harm",
        "relapse",
        "using again",
        "drunk",
        "high right now",
        "drinking again",
      ];
      for (const input of highInputs) {
        const r = service.analyzeContent(input);
        expect(r.isCrisis).toBe(true);
        expect(r.severity).toBe("HIGH");
      }
    });

    it("zero CRITICAL-level false alarms for safe content", () => {
      const safeInputs = [
        "I had a great day today",
        "Looking forward to tomorrow",
        "The weather is nice",
        "I finished my work",
        "Went for a run",
        "Enjoying some coffee",
        "Can't wait for the weekend",
      ];
      for (const input of safeInputs) {
        const r = service.analyzeContent(input);
        expect(r.isCrisis).toBe(false);
      }
    });
  });
});
