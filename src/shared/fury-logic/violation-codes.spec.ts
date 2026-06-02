import {
  FuryViolationCode,
  getViolationLabel,
  getViolationSeverity,
  isFraudViolation,
  isMediaViolation,
  VIOLATION_CODE_CATALOG,
} from "../fury-logic/violation-codes";

describe("FuryViolationCode", () => {
  describe("enum values", () => {
    it("should have all media violation codes", () => {
      expect(FuryViolationCode.MEDIA_TAMPERED).toBe("V-MEDIA-001");
      expect(FuryViolationCode.MEDIA_IRRELEVANT).toBe("V-MEDIA-002");
      expect(FuryViolationCode.MEDIA_UNREADABLE).toBe("V-MEDIA-003");
      expect(FuryViolationCode.MEDIA_DUPLICATE).toBe("V-MEDIA-004");
    });

    it("should have all metadata violation codes", () => {
      expect(FuryViolationCode.METADATA_MISMATCH_TIMESTAMP).toBe("V-META-001");
      expect(FuryViolationCode.METADATA_MISMATCH_LOCATION).toBe("V-META-002");
      expect(FuryViolationCode.METADATA_MISMATCH_DEVICE).toBe("V-META-003");
    });

    it("should have all oath violation codes", () => {
      expect(FuryViolationCode.OATH_CATEGORY_MISMATCH).toBe("V-OATH-001");
      expect(FuryViolationCode.OATH_TARGET_AMBIGUOUS).toBe("V-OATH-002");
    });

    it("should have all fraud violation codes", () => {
      expect(FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION).toBe("V-FRAUD-001");
      expect(FuryViolationCode.FRAUD_SYNTHETIC_CONTENT).toBe("V-FRAUD-002");
      expect(FuryViolationCode.FRAUD_STAGED_SCENE).toBe("V-FRAUD-003");
    });
  });

  describe("catalog", () => {
    it("should have an entry for every violation code", () => {
      const codes = Object.values(FuryViolationCode);
      codes.forEach((code) => {
        expect(VIOLATION_CODE_CATALOG[code]).toBeDefined();
        expect(VIOLATION_CODE_CATALOG[code].code).toBe(code);
        expect(VIOLATION_CODE_CATALOG[code].label.length).toBeGreaterThan(0);
        expect(VIOLATION_CODE_CATALOG[code].description.length).toBeGreaterThan(
          0,
        );
      });
    });

    it("should assign valid severity levels", () => {
      const severities = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
      Object.values(VIOLATION_CODE_CATALOG).forEach((info) => {
        expect(severities.has(info.severity)).toBe(true);
      });
    });
  });

  describe("getViolationLabel", () => {
    it("should return label for known code", () => {
      expect(getViolationLabel(FuryViolationCode.MEDIA_TAMPERED)).toBe(
        "Media Tampered",
      );
    });

    it("should return Unknown for unknown code", () => {
      expect(getViolationLabel("V-FAKE-999" as FuryViolationCode)).toBe(
        "Unknown",
      );
    });
  });

  describe("getViolationSeverity", () => {
    it("should return CRITICAL for fraud codes", () => {
      expect(
        getViolationSeverity(FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION),
      ).toBe("CRITICAL");
    });

    it("should return HIGH for tampered media", () => {
      expect(getViolationSeverity(FuryViolationCode.MEDIA_TAMPERED)).toBe(
        "HIGH",
      );
    });

    it("should default to LOW for unknown codes", () => {
      expect(getViolationSeverity("V-FAKE-999" as FuryViolationCode)).toBe(
        "LOW",
      );
    });
  });

  describe("isFraudViolation", () => {
    it("should return true for fraud codes", () => {
      expect(isFraudViolation(FuryViolationCode.FRAUD_SYNTHETIC_CONTENT)).toBe(
        true,
      );
      expect(isFraudViolation(FuryViolationCode.FRAUD_STAGED_SCENE)).toBe(true);
    });

    it("should return false for non-fraud codes", () => {
      expect(isFraudViolation(FuryViolationCode.MEDIA_TAMPERED)).toBe(false);
      expect(isFraudViolation(FuryViolationCode.OATH_CATEGORY_MISMATCH)).toBe(
        false,
      );
    });
  });

  describe("isMediaViolation", () => {
    it("should return true for media codes", () => {
      expect(isMediaViolation(FuryViolationCode.MEDIA_DUPLICATE)).toBe(true);
    });

    it("should return false for non-media codes", () => {
      expect(
        isMediaViolation(FuryViolationCode.FRAUD_PREVIOUS_SUBMISSION),
      ).toBe(false);
    });
  });
});
