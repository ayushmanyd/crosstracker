import "server-only";

import { asc, eq } from "drizzle-orm";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";

export async function listCategories() {
  const { userId } = await verifySession();

  return db
    .select({
      id: categories.id,
      name: categories.name,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
}
