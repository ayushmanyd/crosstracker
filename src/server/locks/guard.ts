import "server-only";

import { isMonthLocked } from "./queries";

export class LockedPeriodError extends Error {
  constructor(readonly month: string) {
    super(`Month ${month} is locked`);
    this.name = "LockedPeriodError";
  }
}

export async function assertMonthUnlocked(
  userId: string,
  month: string,
  fetchIsLocked: (
    userId: string,
    month: string,
  ) => Promise<boolean> = isMonthLocked,
): Promise<void> {
  if (await fetchIsLocked(userId, month)) {
    throw new LockedPeriodError(month);
  }
}
