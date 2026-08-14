import { describe, expect, it } from "vitest";

import { buildReport } from "./report";

const CATEGORIES = [
  { id: "cat-marketing", name: "Marketing" },
  { id: "cat-payroll", name: "Payroll" },
];

const PLANS = [
  { categoryId: "cat-marketing", month: "2026-01", amountCents: 500_000 },
  { categoryId: "cat-payroll", month: "2026-01", amountCents: 2_000_000 },
  { categoryId: "cat-marketing", month: "2026-02", amountCents: 500_000 },
  { categoryId: "cat-payroll", month: "2026-02", amountCents: 2_000_000 },
];

const ACTUALS = [
  { categoryId: "cat-marketing", month: "2026-01", amountCents: 480_000 },
  { categoryId: "cat-payroll", month: "2026-01", amountCents: 2_050_000 },
  { categoryId: "cat-payroll", month: "2026-02", amountCents: 1_980_000 },
];

describe("buildReport (assignment sample data oracle)", () => {
  const report = buildReport({
    categories: CATEGORIES,
    plans: PLANS,
    actuals: ACTUALS,
    from: "2026-01",
    to: "2026-02",
  });

  it("produces one row per category × month with data", () => {
    expect(report.rows).toHaveLength(4);
  });

  it("2026-01 Marketing: 5,000 plan vs 4,800 actual -> -200 / -4.00%", () => {
    const row = report.rows.find(
      (r) => r.categoryName === "Marketing" && r.month === "2026-01",
    );
    expect(row).toMatchObject({
      planCents: 500_000,
      actualCents: 480_000,
      hasActual: true,
      varianceCents: -20_000,
      variancePct: -4,
    });
  });

  it("2026-01 Payroll: 20,000 plan vs 20,500 actual -> +500 / +2.50%", () => {
    const row = report.rows.find(
      (r) => r.categoryName === "Payroll" && r.month === "2026-01",
    );
    expect(row).toMatchObject({
      planCents: 2_000_000,
      actualCents: 2_050_000,
      hasActual: true,
      varianceCents: 50_000,
      variancePct: 2.5,
    });
  });

  it("2026-02 Marketing (missing actual = 0): -> -5,000 / -100%, hasActual false", () => {
    const row = report.rows.find(
      (r) => r.categoryName === "Marketing" && r.month === "2026-02",
    );
    expect(row).toMatchObject({
      planCents: 500_000,
      actualCents: 0,
      hasActual: false,
      varianceCents: -500_000,
      variancePct: -100,
    });
  });

  it("2026-02 Payroll: 20,000 plan vs 19,800 actual -> -200 / -1.00%", () => {
    const row = report.rows.find(
      (r) => r.categoryName === "Payroll" && r.month === "2026-02",
    );
    expect(row).toMatchObject({
      planCents: 2_000_000,
      actualCents: 1_980_000,
      hasActual: true,
      varianceCents: -20_000,
      variancePct: -1,
    });
  });

  it("monthly totals feed the chart", () => {
    expect(report.monthlyTotals).toEqual([
      {
        month: "2026-01",
        planCents: 2_500_000,
        actualCents: 2_530_000,
        varianceCents: 30_000,
        variancePct: 1.2,
      },
      {
        month: "2026-02",
        planCents: 2_500_000,
        actualCents: 1_980_000,
        varianceCents: -520_000,
        variancePct: -20.8,
      },
    ]);
  });

  it("grand totals", () => {
    expect(report.totals).toMatchObject({
      planCents: 5_000_000,
      actualCents: 4_510_000,
      varianceCents: -490_000,
      variancePct: -9.8,
    });
  });
});

describe("buildReport edge cases", () => {
  it("actual without a plan: plan treated as 0, variance = actual, pct null", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: [],
      actuals: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 75_000 },
      ],
      from: "2026-01",
      to: "2026-01",
    });
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({
      planCents: 0,
      actualCents: 75_000,
      hasActual: true,
      varianceCents: 75_000,
      variancePct: null,
    });
  });

  it("plan of 0 with an actual: pct null, never NaN", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 0 },
      ],
      actuals: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 10_000 },
      ],
      from: "2026-01",
      to: "2026-01",
    });
    expect(report.rows[0].variancePct).toBeNull();
    expect(report.rows[0].varianceCents).toBe(10_000);
  });

  it("multiple actual entries per category × month are summed", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 500_000 },
      ],
      actuals: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 100_000 },
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 250_000 },
      ],
      from: "2026-01",
      to: "2026-01",
    });
    expect(report.rows[0]).toMatchObject({
      actualCents: 350_000,
      hasActual: true,
      varianceCents: -150_000,
    });
  });

  it("a logged $0 actual counts as logged (hasActual true), unlike missing", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 500_000 },
      ],
      actuals: [
        { categoryId: "cat-marketing", month: "2026-01", amountCents: 0 },
      ],
      from: "2026-01",
      to: "2026-01",
    });
    expect(report.rows[0].hasActual).toBe(true);
    expect(report.rows[0].actualCents).toBe(0);
  });

  it("categories with no data in range produce no rows", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: [],
      actuals: [],
      from: "2026-01",
      to: "2026-02",
    });
    expect(report.rows).toHaveLength(0);
    expect(report.monthlyTotals).toHaveLength(2);
    expect(report.totals).toMatchObject({
      planCents: 0,
      actualCents: 0,
      varianceCents: 0,
      variancePct: null,
    });
  });

  it("inverted range produces an empty report", () => {
    const report = buildReport({
      categories: CATEGORIES,
      plans: PLANS,
      actuals: ACTUALS,
      from: "2026-03",
      to: "2026-01",
    });
    expect(report.rows).toHaveLength(0);
    expect(report.monthlyTotals).toHaveLength(0);
  });

  it("rows are sorted by category name, then month", () => {
    const report = buildReport({
      categories: [
        { id: "b", name: "Zeta" },
        { id: "a", name: "Alpha" },
      ],
      plans: [
        { categoryId: "b", month: "2026-02", amountCents: 100 },
        { categoryId: "a", month: "2026-02", amountCents: 100 },
        { categoryId: "a", month: "2026-01", amountCents: 100 },
      ],
      actuals: [],
      from: "2026-01",
      to: "2026-02",
    });
    expect(report.rows.map((r) => [r.categoryName, r.month])).toEqual([
      ["Alpha", "2026-01"],
      ["Alpha", "2026-02"],
      ["Zeta", "2026-02"],
    ]);
  });
});
