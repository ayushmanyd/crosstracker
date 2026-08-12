import { z } from "zod";

export const MONTH_REGEX = /^[0-9]{4}-(0[1-9]|1[0-2])$/;

export const monthSchema = z
  .string()
  .regex(MONTH_REGEX, "Month must be in YYYY-MM format");

export function isMonthString(value: string): boolean {
  return MONTH_REGEX.test(value);
}

export function parseMonth(month: string): { year: number; month: number } {
  if (!isMonthString(month)) {
    throw new Error(`Invalid month "${month}". Expected YYYY-MM.`);
  }
  return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) };
}

export function toMonthString(year: number, month: number): string {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(`Invalid year/month: ${year}/${month}`);
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
}

export function addMonths(month: string, delta: number): string {
  const { year, month: m } = parseMonth(month);
  const total = year * 12 + (m - 1) + delta;
  return toMonthString(Math.floor(total / 12), (((total % 12) + 12) % 12) + 1);
}

export function compareMonths(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function eachMonthInRange(from: string, to: string): string[] {
  if (compareMonths(from, to) > 0) return [];
  const months: string[] = [];
  let cursor = from;
  while (compareMonths(cursor, to) <= 0) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_NAMES_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMonthLabel(
  month: string,
  style: "short" | "long" = "short",
): string {
  const { year, month: m } = parseMonth(month);
  const name =
    style === "short" ? MONTH_NAMES_SHORT[m - 1] : MONTH_NAMES_LONG[m - 1];
  return `${name} ${year}`;
}

export function currentMonth(now: Date = new Date()): string {
  return toMonthString(now.getFullYear(), now.getMonth() + 1);
}
