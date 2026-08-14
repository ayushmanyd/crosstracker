import { describe, it, expect } from "vitest";

describe("Production Smoke Test", () => {
  it("should load the login page successfully", async () => {
    const prodUrl = process.env.TEST_PROD_URL;

    if (!prodUrl) {
      console.log("Skipping smoke test: TEST_PROD_URL is not set.");
      return;
    }

    const response = await fetch(`${prodUrl}/login`);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain("Log in");
    expect(html).toContain("<form");
  });
});
