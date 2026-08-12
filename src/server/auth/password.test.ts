import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("does not store the plaintext and round-trips verification", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("s3cret!");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });

  it("rejects passwords over 72 bytes (bcrypt truncation point)", async () => {
    await expect(hashPassword("a".repeat(73))).rejects.toThrow("72 bytes");
    await expect(hashPassword("🔒".repeat(19))).rejects.toThrow("72 bytes");
  });
});
