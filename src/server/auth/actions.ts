"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";

import { hashPassword, verifyPassword } from "./password";
import { createSession, deleteSession } from "./session";

export type AuthFormState =
  | {
    errors?: { email?: string[]; password?: string[] };
    message?: string;
    email?: string;
  }
  | undefined;

const emailSchema = z
  .email("Enter a valid email address.")
  .trim()
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters.")
  .max(72, "At most 72 characters.")
  .regex(/[a-zA-Z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

// Cost must match BCRYPT_ROUNDS (10) to prevent timing side-channel.
const DUMMY_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailRaw = formData.get("email");
  const parsed = signupSchema.safeParse({
    email: emailRaw,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      email: typeof emailRaw === "string" ? emailRaw : undefined,
    };
  }
  const { email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return {
      message: "An account with this email already exists. Try logging in.",
      email,
    };
  }

  let userId: string;
  try {
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id });
    userId = user.id;
  } catch {
    return {
      message: "Could not create your account. Please try again.",
      email,
    };
  }

  await createSession(userId);
  redirect("/report");
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const emailRaw = formData.get("email");
  const parsed = loginSchema.safeParse({
    email: emailRaw,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      email: typeof emailRaw === "string" ? emailRaw : undefined,
    };
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordValid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordValid) {
    return {
      message: "Invalid email or password.",
      email,
    };
  }

  await createSession(user.id);
  redirect("/report");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
