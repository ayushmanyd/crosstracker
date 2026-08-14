"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { formatMonthLabel, monthSchema } from "@/lib/months";
import { parseAmountToCents } from "@/lib/money";
import { verifySession } from "@/server/dal";
import { db } from "@/server/db";
import { actuals, categories } from "@/server/db/schema";
import { assertMonthUnlocked, LockedPeriodError } from "@/server/locks/guard";
import { getLockedMonths } from "@/server/locks/queries";

export type ActualFormState =
  | {
      errors?: { categoryId?: string[]; amount?: string[]; note?: string[] };
      message?: string;
      success?: boolean;
    }
  | undefined;

const inputSchema = z.object({
  categoryId: z.uuid("Choose a category."),
  note: z.string().trim().max(280, "Keep the note under 280 characters."),
});

type ParsedInput =
  | { ok: true; categoryId: string; amountCents: number; note: string | null }
  | { ok: false; state: ActualFormState };

function parseInput(formData: FormData): ParsedInput {
  const parsed = inputSchema.safeParse({
    categoryId: formData.get("categoryId"),
    note: formData.get("note") ?? "",
  });

  const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

  const rawAmount = formData.get("amount");
  const amountCents =
    typeof rawAmount === "string" && rawAmount.trim() !== ""
      ? parseAmountToCents(rawAmount)
      : null;

  if (!parsed.success || amountCents === null) {
    return {
      ok: false,
      state: {
        errors: {
          categoryId: fieldErrors.categoryId,
          note: fieldErrors.note,
          amount:
            amountCents === null
              ? ["Enter a valid amount (e.g. 100 or 5,000.50)."]
              : undefined,
        },
      },
    };
  }

  return {
    ok: true,
    categoryId: parsed.data.categoryId,
    amountCents,
    note: parsed.data.note === "" ? null : parsed.data.note,
  };
}

function lockedMessage(month: string, entity: string): string {
  return `${formatMonthLabel(month, "long")} is locked - ${entity} for locked months can't be edited.`;
}

async function ownsCategory(
  userId: string,
  categoryId: string,
): Promise<boolean> {
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  return category !== undefined;
}

export async function createActual(
  month: string,
  _state: ActualFormState,
  formData: FormData,
): Promise<ActualFormState> {
  const { userId } = await verifySession();

  const parsedMonth = monthSchema.safeParse(month);
  if (!parsedMonth.success) {
    return { message: "Invalid month." };
  }

  const input = parseInput(formData);
  if (!input.ok) return input.state;

  if (!(await ownsCategory(userId, input.categoryId))) {
    return { message: "Category not found." };
  }

  try {
    await assertMonthUnlocked(userId, parsedMonth.data);
    await db.insert(actuals).values({
      userId,
      categoryId: input.categoryId,
      month: parsedMonth.data,
      amountCents: input.amountCents,
      note: input.note,
    });
  } catch (error) {
    if (error instanceof LockedPeriodError) {
      return { message: lockedMessage(parsedMonth.data, "actuals") };
    }
    throw error;
  }

  refresh();
  return { success: true };
}

export async function updateActual(
  actualId: string,
  _state: ActualFormState,
  formData: FormData,
): Promise<ActualFormState> {
  const { userId } = await verifySession();

  const [existing] = await db
    .select({ id: actuals.id, month: actuals.month })
    .from(actuals)
    .where(and(eq(actuals.id, actualId), eq(actuals.userId, userId)))
    .limit(1);
  if (!existing) {
    return { message: "Entry not found." };
  }

  const input = parseInput(formData);
  if (!input.ok) return input.state;

  if (!(await ownsCategory(userId, input.categoryId))) {
    return { message: "Category not found." };
  }

  try {
    await assertMonthUnlocked(userId, existing.month);
    await db
      .update(actuals)
      .set({
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        note: input.note,
      })
      .where(and(eq(actuals.id, actualId), eq(actuals.userId, userId)));
  } catch (error) {
    if (error instanceof LockedPeriodError) {
      return { message: lockedMessage(existing.month, "actuals") };
    }
    throw error;
  }

  refresh();
  return { success: true };
}

export async function deleteActual(
  actualId: string,
): Promise<{ success?: boolean; message?: string } | undefined> {
  const { userId } = await verifySession();

  const [existing] = await db
    .select({ id: actuals.id, month: actuals.month })
    .from(actuals)
    .where(and(eq(actuals.id, actualId), eq(actuals.userId, userId)))
    .limit(1);
  if (!existing) {
    return { message: "Entry not found." };
  }

  try {
    await assertMonthUnlocked(userId, existing.month);
    await db
      .delete(actuals)
      .where(and(eq(actuals.id, actualId), eq(actuals.userId, userId)));
  } catch (error) {
    if (error instanceof LockedPeriodError) {
      return { message: lockedMessage(existing.month, "actuals") };
    }
    throw error;
  }

  refresh();
  return { success: true };
}

export type CsvImportState =
  | { success?: boolean; message?: string; errors?: string[] }
  | undefined;

export async function importActualsCsv(
  _state: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const { userId } = await verifySession();

  const file = formData.get("file") as File | null;
  if (!file) return { message: "No file selected." };

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) return { message: "File is empty or missing data." };

  const header = lines[0].toLowerCase().split(",").map((s) => s.trim());
  if (
    header[0] !== "month" ||
    header[1] !== "category" ||
    header[2] !== "amount"
  ) {
    return { message: "Invalid CSV header. Expected: month,category,amount" };
  }

  const [userCategories, lockedMonths] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.userId, userId)),
    getLockedMonths(),
  ]);

  const categoryMap = new Map(
    userCategories.map((c) => [c.name.toLowerCase(), c.id]),
  );

  const toInsert: typeof actuals.$inferInsert[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",").map((s) => s.trim());
    if (row.length < 3) continue;

    const [monthRaw, categoryRaw, amountRaw] = row;

    const parsedMonth = monthSchema.safeParse(monthRaw);
    if (!parsedMonth.success) {
      errors.push(`Row ${i + 1}: Invalid month format "${monthRaw}". Expected YYYY-MM.`);
      continue;
    }
    const month = parsedMonth.data;

    if (lockedMonths.has(month)) {
      errors.push(`Row ${i + 1}: ${formatMonthLabel(month, "long")} is locked.`);
      continue;
    }

    const categoryId = categoryMap.get(categoryRaw.toLowerCase());
    if (!categoryId) {
      errors.push(`Row ${i + 1}: Unknown category "${categoryRaw}".`);
      continue;
    }

    const amountCents = parseAmountToCents(amountRaw);
    if (amountCents === null) {
      errors.push(`Row ${i + 1}: Invalid amount "${amountRaw}".`);
      continue;
    }

    toInsert.push({
      userId,
      month,
      categoryId,
      amountCents,
    });
  }

  if (errors.length > 0) {
    return { errors, message: "Validation failed. No actuals were imported." };
  }

  if (toInsert.length > 0) {
    await db.insert(actuals).values(toInsert);
  }

  refresh();
  return { success: true };
}
