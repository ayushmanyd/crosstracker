import { eachMonthInRange } from "./months";
import { computeVariance } from "./variance";

export interface ReportCategoryInput {
  id: string;
  name: string;
}

export interface ReportAmountRow {
  categoryId: string;
  month: string;
  amountCents: number;
}

export interface ReportRow {
  categoryId: string;
  categoryName: string;
  month: string;
  planCents: number;
  actualCents: number;
  hasActual: boolean;
  varianceCents: number;
  variancePct: number | null;
}

export interface MonthlyTotal {
  month: string;
  planCents: number;
  actualCents: number;
  varianceCents: number;
  variancePct: number | null;
}

export interface Report {
  rows: ReportRow[];
  monthlyTotals: MonthlyTotal[];
  totals: MonthlyTotal;
}

export function buildReport(input: {
  categories: ReportCategoryInput[];
  plans: ReportAmountRow[];
  actuals: ReportAmountRow[];
  from: string;
  to: string;
}): Report {
  const months = eachMonthInRange(input.from, input.to);

  const planByKey = new Map<string, number>();
  for (const plan of input.plans) {
    const key = `${plan.categoryId}|${plan.month}`;
    planByKey.set(key, (planByKey.get(key) ?? 0) + plan.amountCents);
  }

  const actualByKey = new Map<string, number>();
  const hasActualByKey = new Set<string>();
  for (const actual of input.actuals) {
    const key = `${actual.categoryId}|${actual.month}`;
    actualByKey.set(key, (actualByKey.get(key) ?? 0) + actual.amountCents);
    hasActualByKey.add(key);
  }

  const sortedCategories = [...input.categories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const rows: ReportRow[] = [];
  for (const category of sortedCategories) {
    for (const month of months) {
      const key = `${category.id}|${month}`;
      const hasPlan = planByKey.has(key);
      const hasActual = hasActualByKey.has(key);
      if (!hasPlan && !hasActual) continue;

      const planCents = planByKey.get(key) ?? 0;
      const actualCents = actualByKey.get(key) ?? 0;
      const { varianceCents, variancePct } = computeVariance(
        planCents,
        actualCents,
      );
      rows.push({
        categoryId: category.id,
        categoryName: category.name,
        month,
        planCents,
        actualCents,
        hasActual,
        varianceCents,
        variancePct,
      });
    }
  }

  const monthlyTotals: MonthlyTotal[] = months.map((month) => {
    let planCents = 0;
    let actualCents = 0;
    for (const row of rows) {
      if (row.month === month) {
        planCents += row.planCents;
        actualCents += row.actualCents;
      }
    }
    const { varianceCents, variancePct } = computeVariance(
      planCents,
      actualCents,
    );
    return { month, planCents, actualCents, varianceCents, variancePct };
  });

  const totalPlan = monthlyTotals.reduce((sum, m) => sum + m.planCents, 0);
  const totalActual = monthlyTotals.reduce((sum, m) => sum + m.actualCents, 0);
  const totals: MonthlyTotal = {
    month: "",
    planCents: totalPlan,
    actualCents: totalActual,
    ...(() => {
      const { varianceCents, variancePct } = computeVariance(
        totalPlan,
        totalActual,
      );
      return { varianceCents, variancePct };
    })(),
  };

  return { rows, monthlyTotals, totals };
}
