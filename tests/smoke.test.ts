import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs assertions", () => {
    expect(1 + 1).toBe(2);
  });

  it("resolves the @ alias to src/", async () => {
    const { cn } = await import("@/lib/utils");
    expect(typeof cn).toBe("function");
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
