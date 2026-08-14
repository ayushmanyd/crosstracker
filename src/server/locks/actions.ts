"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { locks } from "@/server/db/schema";
import { monthSchema } from "@/lib/months";

export async function toggleMonthLock(
  month: string,
  locked: boolean,
): Promise<{ success?: boolean; message?: string; locked?: boolean }> {
  const { userId } = await verifySession();

  const parsedMonth = monthSchema.safeParse(month);
  if (!parsedMonth.success) {
    return { message: "Invalid month." };
  }

  try {
    if (locked) {
      await db
        .insert(locks)
        .values({ userId, month: parsedMonth.data })
        .onConflictDoNothing();
    } else {
      await db
        .delete(locks)
        .where(
          and(eq(locks.userId, userId), eq(locks.month, parsedMonth.data)),
        );
    }
  } catch (error) {
    console.error("Failed to toggle lock status:", error);
    return { message: "Failed to update lock status. Please try again." };
  }

  refresh();
  return { success: true, locked };
}
