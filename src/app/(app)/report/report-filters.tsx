"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReportFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  const [prev, setPrev] = useState({ from, to });
  if (from !== prev.from || to !== prev.to) {
    setPrev({ from, to });
    setF(from);
    setT(to);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/report?from=${f}&to=${t}`);
  };

  const handleReset = () => {
    const currentYear = new Date().getFullYear();
    const defaultFrom = `${currentYear}-01`;
    const defaultTo = `${currentYear}-12`;
    setF(defaultFrom);
    setT(defaultTo);
    router.push(`/report`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row sm:items-end gap-4 border p-4 rounded-lg bg-card text-card-foreground"
    >
      <div className="flex flex-col gap-2 flex-1 w-full sm:max-w-50">
        <Label htmlFor="from">From (YYYY-MM)</Label>
        <Input
          id="from"
          type="month"
          value={f}
          onChange={(e) => setF(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2 flex-1 w-full sm:max-w-50">
        <Label htmlFor="to">To (YYYY-MM)</Label>
        <Input
          id="to"
          type="month"
          value={t}
          onChange={(e) => setT(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          Filter Range
        </Button>
      </div>
    </form>
  );
}
