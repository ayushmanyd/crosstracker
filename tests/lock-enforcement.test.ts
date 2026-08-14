import { describe, expect, it, vi, beforeEach } from "vitest";

import { upsertPlan } from "@/server/plans/actions";
import { createActual } from "@/server/actuals/actions";
import { assertMonthUnlocked, LockedPeriodError } from "@/server/locks/guard";
import { verifySession } from "@/server/dal";
import { db } from "@/server/db";

vi.mock("@/server/dal", () => ({
  verifySession: vi.fn(),
}));

vi.mock("@/server/locks/guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/locks/guard")>();
  return {
    ...actual,
    assertMonthUnlocked: vi.fn(),
  };
});

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi
    .fn()
    .mockResolvedValue([{ id: "123e4567-e89b-12d3-a456-426614174000" }]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/server/db", () => ({
  db: mockDb,
}));

vi.mock("next/cache", () => ({
  refresh: vi.fn(),
}));

describe("Lock Enforcement Integration (Server Actions)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySession).mockResolvedValue({
      isAuth: true,
      userId: "user-1",
    });
  });

  it("upsertPlan enforces locked month", async () => {
    vi.mocked(assertMonthUnlocked).mockRejectedValueOnce(
      new LockedPeriodError("2026-01"),
    );

    const formData = new FormData();
    formData.append("amount", "5000");

    const result = await upsertPlan(
      "123e4567-e89b-12d3-a456-426614174000",
      "2026-01",
      undefined,
      formData,
    );

    expect(assertMonthUnlocked).toHaveBeenCalledWith("user-1", "2026-01");
    expect(result).toEqual({
      message:
        "January 2026 is locked - plans for locked months can't be edited.",
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("upsertPlan succeeds when unlocked", async () => {
    vi.mocked(assertMonthUnlocked).mockResolvedValueOnce();

    const formData = new FormData();
    formData.append("amount", "5000");

    const result = await upsertPlan(
      "123e4567-e89b-12d3-a456-426614174000",
      "2026-01",
      undefined,
      formData,
    );

    expect(assertMonthUnlocked).toHaveBeenCalledWith("user-1", "2026-01");
    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("createActual enforces locked month", async () => {
    vi.mocked(assertMonthUnlocked).mockRejectedValueOnce(
      new LockedPeriodError("2026-01"),
    );

    const formData = new FormData();
    formData.append("categoryId", "123e4567-e89b-12d3-a456-426614174000");
    formData.append("amount", "1000");

    const result = await createActual("2026-01", undefined, formData);

    expect(assertMonthUnlocked).toHaveBeenCalledWith("user-1", "2026-01");
    expect(result).toEqual({
      message:
        "January 2026 is locked - actuals for locked months can't be edited.",
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
