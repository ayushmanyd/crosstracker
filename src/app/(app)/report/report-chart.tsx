"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MonthlyTotal } from "@/lib/report";
import { formatCents } from "@/lib/money";

interface ReportChartProps {
  monthlyTotals: MonthlyTotal[];
}

const chartConfig = {
  variance: {
    label: "Net Variance",
  },
} satisfies ChartConfig;

export function ReportChart({ monthlyTotals }: ReportChartProps) {
  const chartData = useMemo(() => {
    return monthlyTotals.map((item) => {
      const [year, month] = item.month.split("-");
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      return {
        month: monthLabel,
        variance: item.varianceCents / 100,
        varianceCents: item.varianceCents,
        planCents: item.planCents,
        actualCents: item.actualCents,
        fill:
          item.varianceCents > 0
            ? "var(--color-negative)"
            : "var(--color-positive)",
      };
    });
  }, [monthlyTotals]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Net Variance</CardTitle>
        <CardDescription>
          Monthly net variance over the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-75 w-full">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-muted)" }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  formatter={(value, name, item) => {
                    const { planCents, actualCents, varianceCents } =
                      item.payload;

                    const getValueColorClass = (
                      val: number,
                      isVariance = false,
                    ) => {
                      if (val === 0) return "text-foreground";
                      if (isVariance) {
                        return val > 0 ? "text-negative" : "text-positive";
                      }
                      return val > 0 ? "text-positive" : "text-negative";
                    };

                    return (
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex justify-between w-full items-center gap-4">
                          <span className="text-muted-foreground">Plan</span>
                          <span
                            className={`font-mono font-medium tabular-nums ${getValueColorClass(planCents)}`}
                          >
                            {formatCents(planCents)}
                          </span>
                        </div>
                        <div className="flex justify-between w-full items-center gap-4">
                          <span className="text-muted-foreground">Actual</span>
                          <span
                            className={`font-mono font-medium tabular-nums ${getValueColorClass(actualCents)}`}
                          >
                            {formatCents(actualCents)}
                          </span>
                        </div>
                        <div className="flex justify-between w-full items-center gap-4">
                          <span className="text-muted-foreground">
                            Variance
                          </span>
                          <span
                            className={`font-mono font-medium tabular-nums ${getValueColorClass(varianceCents, true)}`}
                          >
                            {formatCents(varianceCents)}
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="variance" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
