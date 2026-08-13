"use client";

import { useActionState, useState } from "react";

import { login, type AuthFormState } from "@/server/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    login,
    undefined,
  );
  const [email, setEmail] = useState("");

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="current-password"
            className="h-10"
            required
            aria-invalid={state?.errors?.password ? true : undefined}
          />
          <FieldError
            errors={state?.errors?.password?.map((message) => ({ message }))}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full font-semibold"
          disabled={pending}
        >
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </FieldGroup>
    </form>
  );
}
