"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { formatMonthLabel, monthSchema } from "@/lib/months";
import { parseAmountToCents } from "@/lib/money";
import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { categories, plans } from "@/server/db/schema";
import { assertMonthUnlocked, LockedPeriodError } from "@/server/locks/guard";

export type PlanFormState = { message?: string; success?: boolean } | undefined;

export async function upsertPlan(
  categoryId: string,
  month: string,
  _state: PlanFormState,
  formData: FormData,
): Promise<PlanFormState> {
  const { userId } = await verifySession();

  const parsedMonth = monthSchema.safeParse(month);
  if (!parsedMonth.success) {
    return { message: "Invalid month." };
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!category) {
    return { message: "Category not found." };
  }

  const rawAmount = formData.get("amount");
  const amountCents =
    typeof rawAmount === "string" ? parseAmountToCents(rawAmount) : null;
  if (amountCents === null) {
    return { message: "Enter a valid amount (e.g. 100 or 5,000.50)." };
  }

  try {
    await assertMonthUnlocked(userId, parsedMonth.data);
    await db
      .insert(plans)
      .values({
        userId,
        categoryId,
        month: parsedMonth.data,
        amountCents,
      })
      .onConflictDoUpdate({
        target: [plans.userId, plans.categoryId, plans.month],
        set: { amountCents },
      });
  } catch (error) {
    if (error instanceof LockedPeriodError) {
      return {
        message: `${formatMonthLabel(parsedMonth.data, "long")} is locked - plans for locked months can't be edited.`,
      };
    }
    throw error;
  }

  refresh();
  return { success: true };
}
