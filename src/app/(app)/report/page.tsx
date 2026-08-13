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
import { verifySession } from "@/server/dal";

export const metadata: Metadata = { title: "Report" };

export default async function ReportPage() {
  await verifySession();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Report"
        description="Plan vs actual with variance, by category and month."
      />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ChartColumn />
          </EmptyMedia>
          <EmptyTitle>No data yet</EmptyTitle>
          <EmptyDescription>
            Once you have plans and actuals, the variance report appears here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
