import { describe, expect, it } from "vitest";

import { buildReportCsv, escapeCsvField } from "./csv";
import { buildReport } from "./report";

describe("escapeCsvField", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvField("Marketing")).toBe("Marketing");
    expect(escapeCsvField("2026-01")).toBe("2026-01");
  });

  it("quotes fields containing commas", () => {
    expect(escapeCsvField("Tools, Software")).toBe('"Tools, Software"');
  });

  it("doubles embedded quotes and wraps in quotes", () => {
    expect(escapeCsvField('Say "hi"')).toBe('"Say ""hi"""');
  });

  it("quotes fields containing newlines", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("buildReportCsv", () => {
  it("matches the assignment sample data exactly", () => {
    const report = buildReport({
      categories: [
        { id: "cat-m", name: "Marketing" },
        { id: "cat-p", name: "Payroll" },
      ],
      plans: [
        { categoryId: "cat-m", month: "2026-01", amountCents: 500000 },
        { categoryId: "cat-p", month: "2026-01", amountCents: 2000000 },
        { categoryId: "cat-m", month: "2026-02", amountCents: 500000 },
        { categoryId: "cat-p", month: "2026-02", amountCents: 2000000 },
      ],
      actuals: [
        { categoryId: "cat-m", month: "2026-01", amountCents: 480000 },
        { categoryId: "cat-p", month: "2026-01", amountCents: 2050000 },
        { categoryId: "cat-p", month: "2026-02", amountCents: 1980000 },
      ],
      from: "2026-01",
      to: "2026-02",
    });

    const csv = buildReportCsv(report);

    expect(csv).toBe(
      [
        "Month,Category,Plan,Actual,Variance,Variance %",
        "2026-01,Marketing,5000.00,4800.00,-200.00,-4.00",
        "2026-01,Payroll,20000.00,20500.00,500.00,2.50",
        "2026-02,Marketing,5000.00,,,",
        "2026-02,Payroll,20000.00,19800.00,-200.00,-1.00",
        "Total,,50000.00,45100.00,-4900.00,-9.80",
        "",
      ].join("\r\n"),
    );
  });

  it("leaves variance % empty when plan is zero", () => {
    const report = buildReport({
      categories: [{ id: "cat-1", name: "Misc" }],
      plans: [{ categoryId: "cat-1", month: "2026-03", amountCents: 0 }],
      actuals: [{ categoryId: "cat-1", month: "2026-03", amountCents: 10000 }],
      from: "2026-03",
      to: "2026-03",
    });

    const csv = buildReportCsv(report);
    const lines = csv.split("\r\n");

    expect(lines[1]).toBe("2026-03,Misc,0.00,100.00,100.00,");
    expect(csv).not.toContain("NaN");
    expect(csv).not.toContain("Infinity");
  });

  it("escapes category names containing commas or quotes", () => {
    const report = buildReport({
      categories: [{ id: "cat-1", name: 'R&D, "Core"' }],
      plans: [{ categoryId: "cat-1", month: "2026-01", amountCents: 1000 }],
      actuals: [],
      from: "2026-01",
      to: "2026-01",
    });

    const csv = buildReportCsv(report);
    const lines = csv.split("\r\n");

    expect(lines[1]).toBe('2026-01,"R&D, ""Core""",10.00,,,');
  });

  it("emits only the header and total row for an empty report", () => {
    const report = buildReport({
      categories: [],
      plans: [],
      actuals: [],
      from: "2026-01",
      to: "2026-02",
    });

    const csv = buildReportCsv(report);

    expect(csv).toBe(
      [
        "Month,Category,Plan,Actual,Variance,Variance %",
        "Total,,0.00,0.00,0.00,",
        "",
      ].join("\r\n"),
    );
  });
});
