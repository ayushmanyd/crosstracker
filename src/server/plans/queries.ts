import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { categories, plans } from "@/server/db/schema";

export async function getPlansForMonth(month: string) {
  const { userId } = await verifySession();

  return db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      amountCents: plans.amountCents,
    })
    .from(categories)
    .leftJoin(
      plans,
      and(
        eq(plans.categoryId, categories.id),
        eq(plans.userId, userId),
        eq(plans.month, month),
      ),
    )
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
}
