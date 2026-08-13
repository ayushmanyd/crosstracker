import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const SESSION_COOKIE = "session";

const sessionPayloadSchema = z.object({
  userId: z.uuid(),
  jti: z.uuid().optional(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export async function signSessionToken(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION_MS) / 1000))
    .sign(new TextEncoder().encode(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );
    const parsed = sessionPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
