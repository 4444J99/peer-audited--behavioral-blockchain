import { describe, it, expect } from "vitest";
import { isoWeekString } from "./iso-week.js";

describe("isoWeekString", () => {
  it("converts a Monday to its ISO week", () => {
    // 2026-06-15 is a Monday → ISO week 2026-W25
    expect(isoWeekString("2026-06-15")).toBe("2026-W25");
  });

  it("handles the first week of the year (containing Jan 4)", () => {
    // 2026-01-05 is a Monday → ISO week 2026-W02
    expect(isoWeekString("2026-01-05")).toBe("2026-W02");
  });

  it("handles week 1 of a year where Jan 1 is a Thursday", () => {
    // 2026-01-01 is a Thursday → ISO week 2026-W01
    expect(isoWeekString("2026-01-01")).toBe("2026-W01");
  });

  it("pads single-digit weeks", () => {
    expect(isoWeekString("2026-01-08")).toBe("2026-W02");
  });
});
