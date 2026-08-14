import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Target } from "lucide-react";

import { currentMonth, formatMonthLabel, monthSchema } from "@/lib/months";
import { MonthNavigator } from "@/components/plans/month-navigator";
import { PlansGrid } from "@/components/plans/plans-grid";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getLockedMonths } from "@/server/locks/queries";
import { getPlansForMonth } from "@/server/plans/queries";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage({
  searchParams,
}: PageProps<"/plans">) {
  const params = await searchParams;
  const parsed = monthSchema.safeParse(params.month);
  const month = parsed.success ? parsed.data : currentMonth();

  const [rows, lockedMonths] = await Promise.all([
    getPlansForMonth(month),
    getLockedMonths(),
  ]);
  const locked = lockedMonths.has(month);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Plans"
          description="Monthly spending targets per category."
        />
        <MonthNavigator month={month} basePath="/plans" />
      </div>

      {locked ? (
        <Alert>
          <Lock className="size-4" />
          <AlertDescription className="flex items-center gap-2">
            <Badge variant="secondary">Locked</Badge>
            {formatMonthLabel(month, "long")} is locked - plans for this month
            are read-only.
          </AlertDescription>
        </Alert>
      ) : null}

      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Target />
            </EmptyMedia>
            <EmptyTitle>No categories to plan for</EmptyTitle>
            <EmptyDescription>
              Create a category first, then set its monthly target here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/categories" />}>
              Go to categories
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <PlansGrid month={month} rows={rows} locked={locked} />
      )}
    </div>
  );
}
