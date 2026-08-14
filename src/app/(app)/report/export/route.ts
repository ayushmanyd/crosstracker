import { type NextRequest, NextResponse } from "next/server";

import { buildReportCsv } from "@/lib/csv";
import { isMonthString } from "@/lib/months";
import { buildReport } from "@/lib/report";
import { verifySession } from "@/server/dal";
import { getReportData } from "@/server/reports/queries";

export async function GET(request: NextRequest) {
  await verifySession();

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";

  if (!isMonthString(from) || !isMonthString(to) || from > to) {
    return NextResponse.json(
      {
        error:
          "Invalid range. Expected from/to as YYYY-MM with from on or before to.",
      },
      { status: 400 },
    );
  }

  const data = await getReportData(from, to);
  const report = buildReport({ ...data, from, to });
  const csv = buildReportCsv(report);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="plan-vs-actual-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
