import "server-only";

import { and, eq } from "drizzle-orm";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { locks } from "@/server/db/schema";

export async function isMonthLocked(
  userId: string,
  month: string,
): Promise<boolean> {
  const [lock] = await db
    .select({ month: locks.month })
    .from(locks)
    .where(and(eq(locks.userId, userId), eq(locks.month, month)))
    .limit(1);
  return lock !== undefined;
}

export async function getLockedMonths(): Promise<Set<string>> {
  const { userId } = await verifySession();

  const rows = await db
    .select({ month: locks.month })
    .from(locks)
    .where(eq(locks.userId, userId));

  return new Set(rows.map((row) => row.month));
}
