"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { importActualsCsv } from "@/server/actuals/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Importing..." : "Import"}
    </Button>
  );
}

export function ImportActualsCsv() {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [state, formAction] = useActionState(importActualsCsv, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIsDirty(false);
    if (state?.success) {
      setOpen(false);
      toast.add({
        title: "Import successful",
        description: "Actuals imported successfully.",
        type: "success",
      });
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="h-9 gap-2" />}
      >
        <Upload className="size-4" />
        <span>Import CSV</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Actuals</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns:{" "}
            <strong>month, category, amount</strong>.
            <br />
            Example:{" "}
            <code className="bg-muted px-1 py-0.5 rounded">
              2026-01, Marketing, 4800
            </code>
            <br />
            <a
              href="https://drive.google.com/uc?export=download&id=1FWDm6_dn9hhvpnqA57cxkmHLTNMxfsQJ"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-primary hover:underline"
            >
              Download sample CSV (Google Drive)
            </a>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".csv"
              required
              onChange={() => setIsDirty(true)}
            />
          </div>

          {state?.message && !state.success && !isDirty && (
            <Alert variant="destructive">
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>
                <p>{state.message}</p>
                {state.errors && state.errors.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-sm max-h-40 overflow-y-auto">
                    {state.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
