"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { toast } from "@/components/ui/toast";

import {
  createCategory,
  type CategoryFormState,
} from "@/server/categories/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(createCategory, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      toast.add({ title: "Category added", type: "success" });
    } else if (state?.message) {
      toast.add({ title: state.message, type: "error" });
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <Field data-invalid={state?.errors?.name ? true : undefined}>
        <FieldLabel htmlFor="category-name" className="sr-only">
          Category name
        </FieldLabel>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            id="category-name"
            name="name"
            placeholder="e.g. Marketing"
            required
            maxLength={60}
            autoComplete="off"
            aria-invalid={state?.errors?.name ? true : undefined}
            className="h-12"
          />
          <Button type="submit" disabled={pending} className="h-12 shrink-0">
            <Plus data-icon="inline-start" />
            {pending ? "Adding…" : "Add category"}
          </Button>
        </div>
        <FieldError
          errors={state?.errors?.name?.map((message) => ({ message }))}
        />
      </Field>
    </form>
  );
}
