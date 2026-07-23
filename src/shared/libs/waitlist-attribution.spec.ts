import { describe, it, expect } from "@jest/globals";
import {
  WAITLIST_CHANNELS,
  classifyWaitlistChannel,
  parseWaitlistAttribution,
} from "./waitlist-attribution";

describe("classifyWaitlistChannel", () => {
  it("returns direct when there are no signals", () => {
    expect(classifyWaitlistChannel([])).toBe("direct");
    expect(classifyWaitlistChannel([null, undefined, "  "])).toBe("direct");
  });

  it("classifies the owned emergency asset as organic traffic", () => {
    // The no-contact emergency tool CTA carries these exact params.
    expect(
      classifyWaitlistChannel([
        "do-not-text-tonight",
        "emergency_asset",
        "do_not_text_your_ex_tonight",
      ]),
    ).toBe("organic");
  });

  it("prefers referral over every other signal", () => {
    expect(
      classifyWaitlistChannel(["creator-post", "referral", "newsletter"]),
    ).toBe("referral");
  });

  it("detects practitioner and creator channels", () => {
    expect(classifyWaitlistChannel(["therapist-handout"])).toBe("practitioner");
    expect(classifyWaitlistChannel(["tiktok"])).toBe("creator");
  });

  it("falls back to direct for an unrecognized source", () => {
    expect(classifyWaitlistChannel(["mystery-campaign-42"])).toBe("direct");
  });

  it("only ever returns a known channel", () => {
    for (const sample of ["referral", "tiktok", "seo", "therapist", "", "??"]) {
      expect(WAITLIST_CHANNELS).toContain(classifyWaitlistChannel([sample]));
    }
  });
});

describe("parseWaitlistAttribution", () => {
  it("preserves the raw source verbatim while deriving the channel", () => {
    const result = parseWaitlistAttribution({
      source: "do-not-text-tonight",
      intent: "no-contact-urge",
      utm_source: "emergency_asset",
      utm_campaign: "do_not_text_your_ex_tonight",
    });

    expect(result.source).toBe("do-not-text-tonight");
    expect(result.channel).toBe("organic");
    expect(result.intent).toBe("no-contact-urge");
    expect(result.utmSource).toBe("emergency_asset");
    expect(result.utmCampaign).toBe("do_not_text_your_ex_tonight");
  });

  it("defaults source to direct and channel to direct when nothing is provided", () => {
    const result = parseWaitlistAttribution({});
    expect(result.source).toBe("direct");
    expect(result.channel).toBe("direct");
    expect(result.intent).toBeNull();
    expect(result.utmSource).toBeNull();
  });

  it("accepts both snake_case and camelCase utm keys", () => {
    const snake = parseWaitlistAttribution({ utm_source: "tiktok" });
    const camel = parseWaitlistAttribution({ utmSource: "tiktok" });
    expect(snake.channel).toBe("creator");
    expect(camel.channel).toBe("creator");
  });

  it("treats a referral code in the ref param as referral traffic", () => {
    const result = parseWaitlistAttribution({ source: "friend", ref: "abc123" });
    expect(result.referralCode).toBe("abc123");
    expect(result.channel).toBe("referral");
  });
});
