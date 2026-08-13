"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { actuals, categories, plans } from "@/server/db/schema";

export type CategoryFormState =
  | {
      errors?: { name?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a category name.")
  .max(60, "Keep it under 60 characters.");

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  if (candidate.code === "23505") return true;
  const cause = candidate.cause;
  return (
    typeof cause === "object" &&
    cause !== null &&
    (cause as { code?: unknown }).code === "23505"
  );
}


export async function createCategory(
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { userId } = await verifySession();

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { errors: { name: parsed.error.issues.map((i) => i.message) } };
  }

  try {
    await db.insert(categories).values({ userId, name: parsed.data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { message: "You already have a category with this name." };
    }
    throw error;
  }

  refresh();
  return { success: true };
}

export async function renameCategory(
  categoryId: string,
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { userId } = await verifySession();

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { errors: { name: parsed.error.issues.map((i) => i.message) } };
  }

  try {
    const updated = await db
      .update(categories)
      .set({ name: parsed.data })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    if (updated.length === 0) {
      return { message: "Category not found." };
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { message: "You already have a category with this name." };
    }
    throw error;
  }

  refresh();
  return { success: true };
}

export async function deleteCategory(
  categoryId: string,
): Promise<{ message?: string } | undefined> {
  const { userId } = await verifySession();

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  if (!category) {
    return { message: "Category not found." };
  }

  const [usedPlan, usedActual] = await Promise.all([
    db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.categoryId, categoryId), eq(plans.userId, userId)))
      .limit(1),
    db
      .select({ id: actuals.id })
      .from(actuals)
      .where(
        and(eq(actuals.categoryId, categoryId), eq(actuals.userId, userId)),
      )
      .limit(1),
  ]);
  if (usedPlan[0] || usedActual[0]) {
    return {
      message: `“${category.name}” has plans or actuals. Remove those before deleting the category.`,
    };
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

  refresh();
  return undefined;
}
