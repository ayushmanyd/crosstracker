"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  deleteActual,
  updateActual,
  type ActualFormState,
} from "@/server/actuals/actions";
import { parseAmountToCents } from "@/lib/money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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

export type ActualEntry = {
  id: string;
  categoryId: string;
  categoryName: string;
  amountCents: number;
  note: string | null;
};

export function ActualActions({
  entry,
  categories,
}: {
  entry: ActualEntry;
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <EditDialog entry={entry} categories={categories} />
      <DeleteDialog entry={entry} />
    </div>
  );
}

function EditDialog({
  entry,
  categories,
}: {
  entry: ActualEntry;
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${entry.categoryName} entry`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit actual</DialogTitle>
          <DialogDescription>
            Update this {entry.categoryName} entry. The month stays put - to
            move it, delete and re-log it.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <EditForm
            entry={entry}
            categories={categories}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  entry,
  categories,
  onDone,
}: {
  entry: ActualEntry;
  categories: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    ActualFormState,
    FormData
  >(updateActual.bind(null, entry.id), undefined);
  const [categoryId, setCategoryId] = useState(entry.categoryId);
  const [initialAmount] = useState((entry.amountCents / 100).toFixed(2));
  const [initialNote] = useState(entry.note ?? "");
  const [clientErrors, setClientErrors] =
    useState<NonNullable<ActualFormState>["errors"]>(undefined);

  useEffect(() => {
    setClientErrors(state?.errors);
    if (state?.success) {
      toast.add({ title: "Successfully updated actual.", type: "success" });
      onDone();
    }
  }, [state, onDone]);

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value as string);
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
          amount: ["Enter a valid amount (e.g. 100 or 5,000.50)."],
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
    <form action={formAction} className="flex flex-col gap-5">
      {state?.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Field data-invalid={clientErrors?.categoryId ? true : undefined}>
        <FieldLabel htmlFor={`edit-category-${entry.id}`}>Category</FieldLabel>
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={handleCategoryChange}
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
        >
          <SelectTrigger id={`edit-category-${entry.id}`}>
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
          errors={clientErrors?.categoryId?.map((message) => ({ message }))}
        />
      </Field>
      <Field data-invalid={clientErrors?.amount ? true : undefined}>
        <FieldLabel htmlFor={`edit-amount-${entry.id}`}>Amount</FieldLabel>
        <Input
          id={`edit-amount-${entry.id}`}
          name="amount"
          defaultValue={initialAmount}
          inputMode="decimal"
          autoComplete="off"
          className="text-right font-mono"
          aria-invalid={clientErrors?.amount ? true : undefined}
          onChange={handleAmountChange}
        />
        <FieldError
          errors={clientErrors?.amount?.map((message) => ({ message }))}
        />
      </Field>
      <Field data-invalid={clientErrors?.note ? true : undefined}>
        <FieldLabel htmlFor={`edit-note-${entry.id}`}>
          Note <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input
          id={`edit-note-${entry.id}`}
          name="note"
          defaultValue={initialNote}
          maxLength={280}
          autoComplete="off"
          aria-invalid={clientErrors?.note ? true : undefined}
          onChange={handleNoteChange}
        />
        <FieldError
          errors={clientErrors?.note?.map((message) => ({ message }))}
        />
      </Field>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" type="button" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteDialog({ entry }: { entry: ActualEntry }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteActual(entry.id);
      if (result?.message) {
        setMessage(result.message);
      } else {
        toast.add({ title: "Successfully deleted actual.", type: "success" });
        setMessage(null);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${entry.categoryName} entry`}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            {entry.categoryName} · {(entry.amountCents / 100).toFixed(2)} - this
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {message ? (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
