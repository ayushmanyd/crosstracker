import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

import {
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./jwt";


export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await signSessionToken({ userId }, env.SESSION_SECRET);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, env.SESSION_SECRET);
});

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
