"use client";

import { useActionState, useEffect } from "react";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { toggleMonthLock } from "@/server/locks/actions";

export function ToggleLockForm({
  month,
  locked,
}: {
  month: string;
  locked: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async () => toggleMonthLock(month, !locked),
    undefined,
  );


  useEffect(() => {
    if (state?.message) {
      toast.add({
        title: state.success ? "Success" : "Error",
        description: state.message,
        type: state.success ? "success" : "error",
      });
    } else if (state?.success) {
      toast.add({
        title: state.locked ? "Month locked" : "Month unlocked",
        description: state.locked
          ? `Plans and actuals for this month are now read-only.`
          : `Plans and actuals for this month can now be edited.`,
        type: "success",
      });
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" className="h-9 w-full gap-2" disabled={pending}>
        {locked ? (
          <>
            <LockOpen className="size-4" />
            <span>Unlock Month</span>
          </>
        ) : (
          <>
            <Lock className="size-4" />
            <span>Lock Month</span>
          </>
        )}
      </Button>
    </form>
  );
}
