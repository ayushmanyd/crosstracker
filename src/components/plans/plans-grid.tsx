"use client";

import { useActionState, useEffect } from "react";

import { upsertPlan, type PlanFormState } from "@/server/plans/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export type PlanGridRow = {
  categoryId: string;
  categoryName: string;
  amountCents: number | null;
};

export function PlansGrid({
  month,
  rows,
  locked,
}: {
  month: string;
  rows: PlanGridRow[];
  locked: boolean;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-0">
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <PlanRow
              key={row.categoryId}
              month={month}
              row={row}
              locked={locked}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PlanRow({
  month,
  row,
  locked,
}: {
  month: string;
  row: PlanGridRow;
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState<PlanFormState, FormData>(
    upsertPlan.bind(null, row.categoryId, month),
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      toast.add({ title: "Plan saved", type: "success" });
    } else if (state?.message) {
      toast.add({ title: state.message, type: "error" });
    }
  }, [state]);

  const savedValue =
    row.amountCents === null ? "" : (row.amountCents / 100).toFixed(2);

  return (
    <li className="flex flex-col gap-1 px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <span className="min-w-0 truncate font-medium">{row.categoryName}</span>
        <form action={formAction} className="flex shrink-0 items-center gap-2">
          <Input
            key={savedValue}
            name="amount"
            defaultValue={savedValue}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            disabled={locked}
            aria-label={`Target amount for ${row.categoryName}`}
            className="w-32 text-right font-mono"
          />
          <Button
            type="submit"
            size="sm"
            disabled={locked || pending}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </form>
      </div>
    </li>
  );
}
