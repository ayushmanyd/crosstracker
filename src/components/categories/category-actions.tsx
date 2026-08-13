"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { toast } from "@/components/ui/toast";
import {
  deleteCategory,
  renameCategory,
  type CategoryFormState,
} from "@/server/categories/actions";
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

export function CategoryActions({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <RenameDialog id={id} name={name} />
      <DeleteDialog id={id} name={name} />
    </div>
  );
}

function RenameDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Rename ${name}`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename category</DialogTitle>
          <DialogDescription>
            Plans and actuals keep pointing at this category.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <RenameForm id={id} name={name} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({
  id,
  name,
  onDone,
}: {
  id: string;
  name: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(renameCategory.bind(null, id), undefined);

  useEffect(() => {
    if (state?.success) {
      toast.add({ title: "Category renamed", type: "success" });
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Field data-invalid={state?.errors?.name ? true : undefined}>
        <FieldLabel htmlFor={`rename-${id}`}>Name</FieldLabel>
        <Input
          key={name}
          id={`rename-${id}`}
          name="name"
          defaultValue={name}
          required
          maxLength={60}
          autoComplete="off"
          aria-invalid={state?.errors?.name ? true : undefined}
        />
        <FieldError
          errors={state?.errors?.name?.map((message) => ({ message }))}
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

function DeleteDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result?.message) {
        setMessage(result.message);
      } else {
        toast.add({ title: "Category deleted", type: "success" });
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
            aria-label={`Delete ${name}`}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
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
