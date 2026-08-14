import { describe, expect, it } from "vitest";

import { computeVariance, formatVariancePct } from "./variance";

describe("computeVariance (assignment sample data)", () => {
  it("2026-01 Marketing: 5,000 plan vs 4,800 actual -> -200 / -4.00%", () => {
    const r = computeVariance(500_000, 480_000);
    expect(r.varianceCents).toBe(-20_000);
    expect(r.variancePct).toBe(-4);
  });

  it("2026-01 Payroll: 20,000 plan vs 20,500 actual -> +500 / +2.50%", () => {
    const r = computeVariance(2_000_000, 2_050_000);
    expect(r.varianceCents).toBe(50_000);
    expect(r.variancePct).toBe(2.5);
  });

  it("2026-02 Marketing (missing actual = 0): -> -5,000 / -100%", () => {
    const r = computeVariance(500_000, 0);
    expect(r.varianceCents).toBe(-500_000);
    expect(r.variancePct).toBe(-100);
  });

  it("2026-02 Payroll: 20,000 plan vs 19,800 actual -> -200 / -1.00%", () => {
    const r = computeVariance(2_000_000, 1_980_000);
    expect(r.varianceCents).toBe(-20_000);
    expect(r.variancePct).toBe(-1);
  });
});

describe("computeVariance edge cases", () => {
  it("plan = 0, actual = 0 -> variance 0, pct null (renders -)", () => {
    const r = computeVariance(0, 0);
    expect(r.varianceCents).toBe(0);
    expect(r.variancePct).toBeNull();
  });

  it("plan = 0, actual > 0 -> variance = actual, pct null (never NaN/Infinity)", () => {
    const r = computeVariance(0, 50_000);
    expect(r.varianceCents).toBe(50_000);
    expect(r.variancePct).toBeNull();
    expect(Number.isFinite(r.variancePct ?? 0)).toBe(true);
  });

  it("handles non-terminating percentages without crashing", () => {
    const r = computeVariance(30_000, 10_000); // -66.666...%
    expect(r.variancePct).toBeCloseTo(-66.6667, 4);
  });
});

describe("formatVariancePct", () => {
  it("formats with sign and two decimals", () => {
    expect(formatVariancePct(-4)).toBe("-4.00%");
    expect(formatVariancePct(2.5)).toBe("+2.50%");
    expect(formatVariancePct(-100)).toBe("-100.00%");
    expect(formatVariancePct(0)).toBe("0.00%");
  });

  it("renders null as an em dash", () => {
    expect(formatVariancePct(null)).toBe("-");
  });
});
