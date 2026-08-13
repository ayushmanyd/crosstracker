import { describe, expect, it } from "vitest";

import { assertMonthUnlocked, LockedPeriodError } from "./guard";

const USER_ID = "5f9c4a1e-3b7d-4f2a-9c8e-1a2b3c4d5e6f";

describe("assertMonthUnlocked", () => {
  it("throws LockedPeriodError when the month is locked", async () => {
    await expect(
      assertMonthUnlocked(USER_ID, "2026-01", async () => true),
    ).rejects.toBeInstanceOf(LockedPeriodError);
  });

  it("carries the locked month on the error", async () => {
    const error = await assertMonthUnlocked(
      USER_ID,
      "2026-02",
      async () => true,
    ).catch((e) => e);
    expect(error).toBeInstanceOf(LockedPeriodError);
    expect(error.month).toBe("2026-02");
    expect(error.message).toContain("2026-02");
  });

  it("resolves when the month is open", async () => {
    await expect(
      assertMonthUnlocked(USER_ID, "2026-01", async () => false),
    ).resolves.toBeUndefined();
  });
});
