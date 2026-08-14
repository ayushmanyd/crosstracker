"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { addMonths } from "@/lib/months";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MonthNavigator({
  month,
  basePath,
}: {
  month: string;
  basePath: string;
}) {
  const router = useRouter();
  const go = (target: string) =>
    router.replace(`${basePath}?month=${target}`, { scroll: false });

  return (
    <div className="w-full lg:w-fit flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="size-9"
        size="icon-sm"
        onClick={() => go(addMonths(month, -1))}
        aria-label="Previous month"
        title="Previous month"
      >
        <ChevronLeft />
      </Button>
      <Input
        type="month"
        value={month}
        onChange={(event) => {
          if (event.target.value) go(event.target.value);
        }}
        className="w-full"
        aria-label="Select month"
      />
      <Button
        type="button"
        variant="outline"
        className="size-9"
        size="icon-sm"
        onClick={() => go(addMonths(month, 1))}
        aria-label="Next month"
        title="Next month"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
