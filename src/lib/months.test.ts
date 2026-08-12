import { describe, expect, it } from "vitest";

import {
  addMonths,
  compareMonths,
  currentMonth,
  eachMonthInRange,
  formatMonthLabel,
  isMonthString,
  monthSchema,
  parseMonth,
  toMonthString,
} from "./months";

describe("isMonthString / monthSchema", () => {
  it("accepts valid YYYY-MM strings", () => {
    expect(isMonthString("2026-01")).toBe(true);
    expect(isMonthString("2026-12")).toBe(true);
    expect(isMonthString("1999-06")).toBe(true);
  });

  it("rejects invalid formats", () => {
    for (const bad of [
      "2026-13",
      "2026-00",
      "2026-1",
      "26-01",
      "2026/01",
      "2026-1-01",
      "",
      "2026-01-01",
    ]) {
      expect(isMonthString(bad), bad).toBe(false);
    }
  });

  it("monthSchema rejects invalid values with a clear message", () => {
    const result = monthSchema.safeParse("2026-13");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Month must be in YYYY-MM format",
      );
    }
  });
});

describe("parseMonth / toMonthString", () => {
  it("round-trips", () => {
    expect(parseMonth("2026-01")).toEqual({ year: 2026, month: 1 });
    expect(toMonthString(2026, 1)).toBe("2026-01");
    expect(toMonthString(2026, 12)).toBe("2026-12");
  });

  it("parseMonth throws on invalid input", () => {
    expect(() => parseMonth("2026-13")).toThrow("Invalid month");
  });

  it("toMonthString throws on out-of-range month", () => {
    expect(() => toMonthString(2026, 13)).toThrow("Invalid year/month");
  });
});

describe("addMonths", () => {
  it("adds within a year", () => {
    expect(addMonths("2026-01", 2)).toBe("2026-03");
  });

  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2025-12", 1)).toBe("2026-01");
    expect(addMonths("2026-11", 5)).toBe("2027-04");
  });
});

describe("eachMonthInRange", () => {
  it("lists an inclusive range within a quarter", () => {
    expect(eachMonthInRange("2026-01", "2026-03")).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
    ]);
  });

  it("crosses a year boundary", () => {
    expect(eachMonthInRange("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("returns a single month when from === to", () => {
    expect(eachMonthInRange("2026-01", "2026-01")).toEqual(["2026-01"]);
  });

  it("returns [] when from > to", () => {
    expect(eachMonthInRange("2026-03", "2026-01")).toEqual([]);
  });
});

describe("compareMonths", () => {
  it("orders chronologically", () => {
    expect(compareMonths("2026-01", "2026-02")).toBe(-1);
    expect(compareMonths("2026-02", "2026-01")).toBe(1);
    expect(compareMonths("2026-01", "2026-01")).toBe(0);
    expect(compareMonths("2025-12", "2026-01")).toBe(-1);
  });
});

describe("formatMonthLabel", () => {
  it("formats short and long labels without Date/timezone involvement", () => {
    expect(formatMonthLabel("2026-01")).toBe("Jan 2026");
    expect(formatMonthLabel("2026-12", "long")).toBe("December 2026");
  });
});

describe("currentMonth", () => {
  it("derives from the provided date", () => {
    expect(currentMonth(new Date(2026, 0, 15))).toBe("2026-01");
    expect(currentMonth(new Date(2026, 11, 31))).toBe("2026-12");
  });
});
