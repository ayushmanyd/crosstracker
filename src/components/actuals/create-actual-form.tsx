"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Plus } from "lucide-react";

import { createActual, type ActualFormState } from "@/server/actuals/actions";
import { parseAmountToCents } from "@/lib/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

export function CreateActualForm({
  month,
  categories,
  locked,
}: {
  month: string;
  categories: { id: string; name: string }[];
  locked: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [categoryId, setCategoryId] = useState("");
  const [clientErrors, setClientErrors] =
    useState<NonNullable<ActualFormState>["errors"]>(undefined);

  const [state, formAction, pending] = useActionState<
    ActualFormState,
    FormData
  >(async (previousState, formData) => {
    const result = await createActual(month, previousState, formData);
    if (result?.success) {
      formRef.current?.reset();
      setCategoryId("");
    }
    return result;
  }, undefined);

  useEffect(() => {
    setClientErrors(state?.errors);
    if (state?.success) {
      toast.add({ title: "Successfully logged actual.", type: "success" });
    } else if (state?.errors?.amount) {
      toast.add({ title: state.errors.amount[0], type: "error" });
      document.getElementById("actual-amount")?.focus();
    } else if (state?.message) {
      toast.add({ title: state.message, type: "error" });
    }
  }, [state]);

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value ?? "");
    if (clientErrors?.categoryId) {
      setClientErrors({ ...clientErrors, categoryId: undefined });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.trim() === "") {
      if (clientErrors?.amount) {
        setClientErrors({ ...clientErrors, amount: undefined });
      }
      return;
    }

    const parsed = parseAmountToCents(value);
    if (parsed === null) {
      const cleaned = value
        .trim()
        .replace(/^\$\s*/, "")
        .replace(/,/g, "");
      if (!/^\d+\.$/.test(cleaned)) {
        setClientErrors({
          ...clientErrors,
          amount: ["Enter a valid amount (e.g. 4800 or 4,800.50)."],
        });
      }
    } else {
      if (clientErrors?.amount) {
        setClientErrors({ ...clientErrors, amount: undefined });
      }
    }
  };

  const handleNoteChange = () => {
    if (clientErrors?.note) {
      setClientErrors({ ...clientErrors, note: undefined });
    }
  };

  return (
    <form ref={formRef} action={formAction}>
      <FieldGroup className="gap-4">
        {state?.message ? (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field data-invalid={clientErrors?.categoryId ? true : undefined}>
            <FieldLabel htmlFor="actual-category">Category</FieldLabel>
            <Select
              name="categoryId"
              value={categoryId}
              onValueChange={handleCategoryChange}
              disabled={locked}
              items={categories.map((c) => ({ value: c.id, label: c.name }))}
            >
              <SelectTrigger id="actual-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError
              errors={clientErrors?.categoryId?.map((message) => ({
                message,
              }))}
            />
          </Field>
          <Field data-invalid={clientErrors?.amount ? true : undefined}>
            <FieldLabel htmlFor="actual-amount">Amount</FieldLabel>
            <Input
              id="actual-amount"
              name="amount"
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              disabled={locked}
              className="text-right font-mono"
              aria-invalid={clientErrors?.amount ? true : undefined}
              onChange={handleAmountChange}
            />
            <FieldError
              errors={clientErrors?.amount?.map((message) => ({ message }))}
            />
          </Field>
        </div>
        <Field data-invalid={clientErrors?.note ? true : undefined}>
          <FieldLabel htmlFor="actual-note">
            Note <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="actual-note"
            name="note"
            placeholder="e.g. Invoice #1042"
            maxLength={280}
            autoComplete="off"
            disabled={locked}
            aria-invalid={clientErrors?.note ? true : undefined}
            onChange={handleNoteChange}
          />
          <FieldError
            errors={clientErrors?.note?.map((message) => ({ message }))}
          />
        </Field>
        <div>
          <Button type="submit" disabled={locked || pending}>
            <Plus data-icon="inline-start" />
            {pending ? "Logging…" : "Log actual"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
