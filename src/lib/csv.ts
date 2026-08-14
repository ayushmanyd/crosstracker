import type { Report } from "./report";

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCentsPlain(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatPctPlain(pct: number | null): string {
  return pct === null ? "" : pct.toFixed(2);
}

export function buildReportCsv(report: Report): string {
  const header = [
    "Month",
    "Category",
    "Plan",
    "Actual",
    "Variance",
    "Variance %",
  ];

  const lines: string[] = [header.map(escapeCsvField).join(",")];

  const sortedRows = [...report.rows].sort((a, b) => {
    const monthCmp = a.month.localeCompare(b.month);
    if (monthCmp !== 0) return monthCmp;
    return a.categoryName.localeCompare(b.categoryName);
  });

  for (const row of sortedRows) {
    lines.push(
      [
        row.month,
        escapeCsvField(row.categoryName),
        formatCentsPlain(row.planCents),
        row.hasActual ? formatCentsPlain(row.actualCents) : "",
        row.hasActual ? formatCentsPlain(row.varianceCents) : "",
        row.hasActual ? formatPctPlain(row.variancePct) : "",
      ].join(","),
    );
  }

  lines.push(
    [
      "Total",
      "",
      formatCentsPlain(report.totals.planCents),
      formatCentsPlain(report.totals.actualCents),
      formatCentsPlain(report.totals.varianceCents),
      formatPctPlain(report.totals.variancePct),
    ].join(","),
  );

  return lines.join("\r\n") + "\r\n";
}
