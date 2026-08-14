import { Info } from "lucide-react";

import { Report } from "@/lib/report";
import { formatCents, formatSignedCents } from "@/lib/money";
import { formatVariancePct } from "@/lib/variance";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReportTable({ report }: { report: Report }) {
  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-muted border-b">
            <tr>
              <th className="p-3 font-medium">Month</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">
                <div className="flex items-center justify-end gap-1">
                  Plan
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm tracking-normal">
                        The target amount set for the category in this month.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </th>
              <th className="p-3 font-medium text-right">
                <div className="flex items-center justify-end gap-1">
                  Actual
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm tracking-normal">
                        The logged amount spent for the category in this month.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </th>
              <th className="p-3 font-medium text-right">
                <div className="flex items-center justify-end gap-1">
                  Variance
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm tracking-normal">
                        The difference between Actual and Plan (Actual - Plan).
                        Negative means under budget.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </th>
              <th className="p-3 font-medium text-right">
                <div className="flex items-center justify-end gap-1">
                  Var %
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm tracking-normal">
                        Variance as a percentage of the Plan.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...report.rows]
              .sort((a, b) => {
                const monthCmp = a.month.localeCompare(b.month);
                if (monthCmp !== 0) return monthCmp;
                return a.categoryName.localeCompare(b.categoryName);
              })
              .map((row) => (
                <tr
                  key={`${row.categoryId}-${row.month}`}
                  className="hover:bg-muted/50"
                >
                  <td className="p-3 font-medium text-foreground">
                    {row.month}
                  </td>
                  <td className="p-3 font-medium">{row.categoryName}</td>
                  <td className="p-3 text-right">
                    {formatCents(row.planCents)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {row.hasActual ? formatCents(row.actualCents) : "-"}
                  </td>
                  <td className="p-3 text-right">
                    {row.hasActual ? (
                      <span
                        className={cn(
                          row.varianceCents < 0
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-500",
                        )}
                      >
                        {formatSignedCents(row.varianceCents)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {row.hasActual ? (
                      <span
                        className={cn(
                          row.variancePct === null
                            ? "text-muted-foreground"
                            : row.variancePct < 0
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-500",
                        )}
                      >
                        {formatVariancePct(row.variancePct)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot className="bg-muted border-t font-semibold">
            <tr>
              <td className="p-3" colSpan={2}>
                Total
              </td>
              <td className="p-3 text-right">
                {formatCents(report.totals.planCents)}
              </td>
              <td className="p-3 text-right">
                {formatCents(report.totals.actualCents)}
              </td>
              <td className="p-3 text-right">
                <span
                  className={cn(
                    report.totals.varianceCents < 0
                      ? "text-destructive"
                      : "text-emerald-600 dark:text-emerald-500",
                  )}
                >
                  {formatSignedCents(report.totals.varianceCents)}
                </span>
              </td>
              <td className="p-3 text-right">
                <span
                  className={cn(
                    report.totals.variancePct === null
                      ? "text-muted-foreground"
                      : report.totals.variancePct < 0
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-500",
                  )}
                >
                  {formatVariancePct(report.totals.variancePct)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TooltipProvider>
  );
}
