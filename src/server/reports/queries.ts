import "server-only";

import { and, asc, eq, gte, lte } from "drizzle-orm";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { actuals, categories, plans } from "@/server/db/schema";

export async function getReportData(from: string, to: string) {
  const { userId } = await verifySession();

  const [categoryRows, planRows, actualRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.name)),
    db
      .select({
        categoryId: plans.categoryId,
        month: plans.month,
        amountCents: plans.amountCents,
      })
      .from(plans)
      .where(
        and(
          eq(plans.userId, userId),
          gte(plans.month, from),
          lte(plans.month, to),
        ),
      ),
    db
      .select({
        categoryId: actuals.categoryId,
        month: actuals.month,
        amountCents: actuals.amountCents,
      })
      .from(actuals)
      .where(
        and(
          eq(actuals.userId, userId),
          gte(actuals.month, from),
          lte(actuals.month, to),
        ),
      ),
  ]);

  return { categories: categoryRows, plans: planRows, actuals: actualRows };
}
