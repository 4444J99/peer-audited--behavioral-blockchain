import { JurisdictionDispositionMapper } from "./jurisdiction-disposition.mapper";
import { JurisdictionTier } from "../../../services/geofencing";

describe("JurisdictionDispositionMapper", () => {
  beforeEach(() => {
    JurisdictionDispositionMapper.setRefundOnlyMode(false);
  });

  describe("getDispositionMode", () => {
    it("should return CAPTURE for TIER_1 (FULL_ACCESS)", () => {
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_1,
        ),
      ).toBe("CAPTURE");
    });

    it("should return REFUND for TIER_2 (REFUND_ONLY)", () => {
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_2,
        ),
      ).toBe("REFUND");
    });

    it("should return REFUND for TIER_3 (HARD_BLOCK)", () => {
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_3,
        ),
      ).toBe("REFUND");
    });

    it("should return REFUND for null tier (fail-closed)", () => {
      expect(JurisdictionDispositionMapper.getDispositionMode(null)).toBe(
        "REFUND",
      );
    });

    it("should return REFUND for undefined tier (fail-closed)", () => {
      expect(JurisdictionDispositionMapper.getDispositionMode(undefined)).toBe(
        "REFUND",
      );
    });
  });

  describe("kill switch (refund-only mode)", () => {
    it("should return REFUND for TIER_1 when kill switch is active", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_1,
        ),
      ).toBe("REFUND");
    });

    it("should return REFUND for TIER_2 when kill switch is active", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_2,
        ),
      ).toBe("REFUND");
    });

    it("should return REFUND for TIER_3 when kill switch is active", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_3,
        ),
      ).toBe("REFUND");
    });

    it("should return REFUND for null when kill switch is active", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(JurisdictionDispositionMapper.getDispositionMode(null)).toBe(
        "REFUND",
      );
    });

    it("should revert to normal behavior when kill switch is deactivated", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_1,
        ),
      ).toBe("REFUND");

      JurisdictionDispositionMapper.setRefundOnlyMode(false);
      expect(
        JurisdictionDispositionMapper.getDispositionMode(
          JurisdictionTier.TIER_1,
        ),
      ).toBe("CAPTURE");
    });
  });

  describe("isRefundOnlyMode", () => {
    it("should return false by default", () => {
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(false);
    });

    it("should return true when set", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(true);
    });

    it("should return false when unset", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      JurisdictionDispositionMapper.setRefundOnlyMode(false);
      expect(JurisdictionDispositionMapper.isRefundOnlyMode()).toBe(false);
    });
  });

  describe("payout matrix — all configured states", () => {
    // TIER_1 states: CAPTURE
    const tier1States = [
      "CA",
      "TX",
      "FL",
      "IL",
      "OH",
      "GA",
      "NC",
      "MI",
      "NJ",
      "MA",
      "WI",
      "MN",
      "CO",
      "AL",
      "MD",
      "MO",
      "OK",
      "OR",
      "KY",
      "NV",
      "KS",
      "NE",
      "MS",
      "NM",
      "WV",
      "NH",
      "ND",
      "SD",
      "DE",
      "RI",
      "VT",
      "WY",
      "AK",
      "DC",
    ];

    // TIER_2 states: REFUND
    const tier2States = [
      "NY",
      "CT",
      "MT",
      "AZ",
      "IA",
      "LA",
      "ME",
      "TN",
      "VA",
      "IN",
      "PA",
    ];

    // TIER_3 states: REFUND
    const tier3States = ["WA", "AR", "HI", "UT", "ID", "SC"];

    it.each(tier1States)(
      "should return CAPTURE for TIER_1 state %s",
      (state) => {
        expect(
          JurisdictionDispositionMapper.getDispositionMode(
            JurisdictionTier.TIER_1,
          ),
        ).toBe("CAPTURE");
      },
    );

    it.each(tier2States)(
      "should return REFUND for TIER_2 state %s",
      (state) => {
        expect(
          JurisdictionDispositionMapper.getDispositionMode(
            JurisdictionTier.TIER_2,
          ),
        ).toBe("REFUND");
      },
    );

    it.each(tier3States)(
      "should return REFUND for TIER_3 state %s",
      (state) => {
        expect(
          JurisdictionDispositionMapper.getDispositionMode(
            JurisdictionTier.TIER_3,
          ),
        ).toBe("REFUND");
      },
    );

    it("should return REFUND for all states when kill switch is active", () => {
      JurisdictionDispositionMapper.setRefundOnlyMode(true);
      const allStates = [...tier1States, ...tier2States, ...tier3States];
      for (const state of allStates) {
        expect(
          JurisdictionDispositionMapper.getDispositionMode(
            JurisdictionTier.TIER_1,
          ),
        ).toBe("REFUND");
      }
    });
  });
});
