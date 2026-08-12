import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

import { getSession } from "./auth/session";

// Data Access Layer entry point
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return { isAuth: true, userId: session.userId } as const;
});

export const getUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const rows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
});
