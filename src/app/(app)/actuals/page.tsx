import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Receipt, Tags } from "lucide-react";

import { currentMonth, formatMonthLabel, monthSchema } from "@/lib/months";
import { formatCents } from "@/lib/money";
import { ActualActions } from "@/components/actuals/actual-actions";
import { CreateActualForm } from "@/components/actuals/create-actual-form";
import { ImportActualsCsv } from "@/components/actuals/import-actuals-csv";
import { PageHeader } from "@/components/page-header";
import { MonthNavigator } from "@/components/plans/month-navigator";
import { ToggleLockForm } from "@/components/plans/toggle-lock-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getActualsForMonth } from "@/server/actuals/queries";
import { listCategories } from "@/server/categories/queries";
import { getLockedMonths } from "@/server/locks/queries";

export const metadata: Metadata = { title: "Actuals" };

export default async function ActualsPage({
  searchParams,
}: PageProps<"/actuals">) {
  const params = await searchParams;
  const parsed = monthSchema.safeParse(params.month);
  const month = parsed.success ? parsed.data : currentMonth();

  const [entries, categories, lockedMonths] = await Promise.all([
    getActualsForMonth(month),
    listCategories(),
    getLockedMonths(),
  ]);
  const locked = lockedMonths.has(month);
  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title="Actuals"
            description="What you actually spent, per category and month."
          />
          <div className="flex items-center gap-2">
            <ImportActualsCsv />
            <ToggleLockForm month={month} locked={locked} />
          </div>
        </div>
        <div className="w-full flex justify-end">
          <MonthNavigator month={month} basePath="/actuals" />
        </div>
      </div>

      {locked ? (
        <Alert>
          <Lock className="size-4" />
          <AlertDescription className="flex items-center gap-2">
            <Badge variant="secondary">Locked</Badge>
            {formatMonthLabel(month, "long")} is locked - actuals for this month
            are read-only.
          </AlertDescription>
        </Alert>
      ) : null}

      {categories.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Tags />
            </EmptyMedia>
            <EmptyTitle>No categories yet</EmptyTitle>
            <EmptyDescription>
              Actuals belong to categories - create one first.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/categories" />}>
              Go to categories
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <Card>
            <CardContent>
              <CreateActualForm
                month={month}
                categories={categories}
                locked={locked}
              />
            </CardContent>
          </Card>

          {entries.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Receipt />
                </EmptyMedia>
                <EmptyTitle>
                  No actuals for {formatMonthLabel(month, "long")}
                </EmptyTitle>
                <EmptyDescription>
                  Log what you actually spent this month using the form above.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Card className="py-0">
              <CardContent className="px-0">
                <ul className="divide-y divide-border">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {entry.categoryName}
                        </p>
                        {entry.note ? (
                          <p className="truncate text-sm text-muted-foreground">
                            {entry.note}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono text-sm tabular-nums">
                          {formatCents(entry.amountCents)}
                        </span>
                        {!locked ? (
                          <ActualActions
                            entry={entry}
                            categories={categories}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-4 bg-muted/40 px-5 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total · {entries.length}{" "}
                      {entries.length === 1 ? "entry" : "entries"}
                    </span>
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {formatCents(totalCents)}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
