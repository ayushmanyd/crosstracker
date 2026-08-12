import { describe, expect, it } from "vitest";

import { formatCents, formatSignedCents, parseAmountToCents } from "./money";

describe("parseAmountToCents", () => {
  it("parses plain amounts", () => {
    expect(parseAmountToCents("4800")).toBe(480000);
    expect(parseAmountToCents("0")).toBe(0);
    expect(parseAmountToCents("0.99")).toBe(99);
  });

  it("parses formatted amounts ($, commas, 1-2 decimals)", () => {
    expect(parseAmountToCents("$4,800.50")).toBe(480050);
    expect(parseAmountToCents("20,000")).toBe(2000000);
    expect(parseAmountToCents("4800.5")).toBe(480050);
  });

  it("is exact for tenths (string parsing, no float math)", () => {
    expect(parseAmountToCents("4.10")).toBe(410);
  });

  it("rejects invalid input", () => {
    for (const bad of ["", "abc", "-5", "1.005", "5.0.0", "$"]) {
      expect(parseAmountToCents(bad), bad).toBeNull();
    }
  });
});

describe("formatCents", () => {
  it("formats USD", () => {
    expect(formatCents(480050)).toBe("$4,800.50");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(2000000)).toBe("$20,000.00");
  });

  it("formats negatives with a leading minus", () => {
    expect(formatCents(-20000)).toBe("-$200.00");
  });
});

describe("formatSignedCents", () => {
  it("always shows an explicit sign for non-zero values", () => {
    expect(formatSignedCents(50000)).toBe("+$500.00");
    expect(formatSignedCents(-20000)).toBe("-$200.00");
    expect(formatSignedCents(0)).toBe("$0.00");
  });
});
