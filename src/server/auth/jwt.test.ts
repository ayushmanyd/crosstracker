import { describe, expect, it } from "vitest";

import { signSessionToken, verifySessionToken } from "./jwt";

const SECRET = "test-secret-that-is-long-enough-32+";
const USER_ID = "5f9c4a1e-3b7d-4f2a-9c8e-1a2b3c4d5e6f";

describe("session tokens", () => {
  it("round-trips a signed token", async () => {
    const token = await signSessionToken({ userId: USER_ID }, SECRET);
    expect(await verifySessionToken(token, SECRET)).toMatchObject({
      userId: USER_ID,
    });
  });

  it("includes a jti so sessions can be revoked server-side later", async () => {
    const token = await signSessionToken({ userId: USER_ID }, SECRET);
    const payload = await verifySessionToken(token, SECRET);
    expect(payload?.jti).toBeDefined();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSessionToken({ userId: USER_ID }, SECRET);
    expect(
      await verifySessionToken(token, "another-secret-0123456789abcdef"),
    ).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSessionToken({ userId: USER_ID }, SECRET);
    const tampered = `${token.slice(0, -2)}xx`;
    expect(await verifySessionToken(tampered, SECRET)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-jwt", SECRET)).toBeNull();
  });
});
