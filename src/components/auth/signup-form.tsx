"use client";

import { useActionState, useState } from "react";

import { signup, type AuthFormState } from "@/server/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signup,
    undefined,
  );
  const [password, setPassword] = useState("");

  const isPasswordValid =
    password.length >= 8 &&
    password.length <= 72 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password);

  return (
    <form action={formAction}>
      <FieldGroup className="gap-6">
        {state?.message ? (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={state?.errors?.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10"
            required
            defaultValue={state?.email}
            aria-invalid={state?.errors?.email ? true : undefined}
          />
          <FieldError
            errors={state?.errors?.email?.map((message) => ({ message }))}
          />
        </Field>
        <Field data-invalid={state?.errors?.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="h-10"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={state?.errors?.password ? true : undefined}
          />
          {state?.errors?.password ? (
            <FieldError
              errors={state.errors.password.map((message) => ({ message }))}
            />
          ) : (
            <FieldDescription>
              At least 8 characters, with a letter and a number.
            </FieldDescription>
          )}
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold"
          disabled={pending || !isPasswordValid}
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}
