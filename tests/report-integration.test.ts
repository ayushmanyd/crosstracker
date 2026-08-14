import { describe, expect, it, vi, beforeEach } from "vitest";

import { getReportData } from "@/server/reports/queries";
import { verifySession } from "@/server/dal";
import { db } from "@/server/db";

vi.mock("@/server/dal", () => ({
  verifySession: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([{ id: "cat-1", name: "Marketing" }]),
}));

vi.mock("@/server/db", () => ({
  db: mockDb,
}));

describe("Report Queries Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySession).mockResolvedValue({
      isAuth: true,
      userId: "user-1",
    });
  });

  it("getReportData correctly issues parallel queries", async () => {
    const plansResult = [
      { categoryId: "cat-1", month: "2026-01", amountCents: 500000 },
    ];
    const actualsResult = [
      { categoryId: "cat-1", month: "2026-01", amountCents: 480000 },
    ];

    mockDb.where = vi
      .fn()
      .mockReturnValueOnce({
        orderBy: vi
          .fn()
          .mockResolvedValue([{ id: "cat-1", name: "Marketing" }]),
      })
      .mockResolvedValueOnce(plansResult)
      .mockResolvedValueOnce(actualsResult);

    const data = await getReportData("2026-01", "2026-01");

    expect(data.categories).toEqual([{ id: "cat-1", name: "Marketing" }]);
    expect(data.plans).toEqual(plansResult);
    expect(data.actuals).toEqual(actualsResult);
    expect(mockDb.select).toHaveBeenCalledTimes(3);
    expect(mockDb.from).toHaveBeenCalledTimes(3);
  });
});
