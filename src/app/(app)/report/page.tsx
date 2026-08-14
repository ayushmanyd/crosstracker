import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getReportData } from "@/server/reports/queries";
import { buildReport } from "@/lib/report";
import { verifySession } from "@/server/dal";

import { ReportFilters } from "./report-filters";
import { ReportTable } from "./report-table";

export const metadata: Metadata = { title: "Report" };

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReportPage(props: PageProps) {
  await verifySession();
  const searchParams = await props.searchParams;

  const currentYear = new Date().getFullYear();
  const defaultFrom = `${currentYear}-01`;
  const defaultTo = `${currentYear}-12`;
  const from = searchParams.from || defaultFrom;
  const to = searchParams.to || defaultTo;

  const data = await getReportData(from, to);
  const report = buildReport({ ...data, from, to });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Report"
        description="Plan vs actual with variance, by category and month."
      />

      <ReportFilters from={from} to={to} />

      {report.rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartColumn />
            </EmptyMedia>
            <EmptyTitle>No data yet</EmptyTitle>
            <EmptyDescription>
              Once you have plans and actuals in the selected date range, the
              variance report appears here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ReportTable report={report} />
      )}
    </div>
  );
}
