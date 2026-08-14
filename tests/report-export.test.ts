import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/(app)/report/export/route";
import { verifySession } from "@/server/dal";

vi.mock("@/server/dal", () => ({
  verifySession: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: mockDb,
}));

function makeRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as unknown as Parameters<typeof GET>[0];
}

describe("GET /report/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySession).mockResolvedValue({
      isAuth: true,
      userId: "user-1",
    });
  });

  it("returns a CSV attachment for a valid range", async () => {
    mockDb.where = vi
      .fn()
      .mockReturnValueOnce({
        orderBy: vi
          .fn()
          .mockResolvedValue([{ id: "cat-1", name: "Marketing" }]),
      })
      .mockResolvedValueOnce([
        { categoryId: "cat-1", month: "2026-01", amountCents: 500000 },
      ])
      .mockResolvedValueOnce([
        { categoryId: "cat-1", month: "2026-01", amountCents: 480000 },
      ]);

    const response = await GET(
      makeRequest("http://localhost/report/export?from=2026-01&to=2026-01"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="plan-vs-actual-2026-01-to-2026-01.csv"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = await response.text();
    expect(body).toBe(
      [
        "Month,Category,Plan,Actual,Variance,Variance %",
        "2026-01,Marketing,5000.00,4800.00,-200.00,-4.00",
        "Total,,5000.00,4800.00,-200.00,-4.00",
        "",
      ].join("\r\n"),
    );
  });

  it("rejects an invalid month format with 400", async () => {
    const response = await GET(
      makeRequest("http://localhost/report/export?from=2026-1&to=2026-12"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error:
        "Invalid range. Expected from/to as YYYY-MM with from on or before to.",
    });
  });

  it("rejects a reversed range with 400", async () => {
    const response = await GET(
      makeRequest("http://localhost/report/export?from=2026-12&to=2026-01"),
    );

    expect(response.status).toBe(400);
  });

  it("rejects missing params with 400", async () => {
    const response = await GET(makeRequest("http://localhost/report/export"));

    expect(response.status).toBe(400);
  });
});
