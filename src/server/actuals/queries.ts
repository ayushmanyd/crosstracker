import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { actuals, categories } from "@/server/db/schema";

export async function getActualsForMonth(month: string) {
  const { userId } = await verifySession();

  return db
    .select({
      id: actuals.id,
      categoryId: actuals.categoryId,
      categoryName: categories.name,
      amountCents: actuals.amountCents,
      note: actuals.note,
    })
    .from(actuals)
    .innerJoin(categories, eq(actuals.categoryId, categories.id))
    .where(and(eq(actuals.userId, userId), eq(actuals.month, month)))
    .orderBy(asc(categories.name), asc(actuals.createdAt));
}
