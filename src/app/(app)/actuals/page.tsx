import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { verifySession } from "@/server/dal";

export const metadata: Metadata = { title: "Actuals" };

export default async function ActualsPage() {
  await verifySession();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Actuals"
        description="What you actually spent, per category and month."
      />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>No actuals yet</EmptyTitle>
          <EmptyDescription>
            Log actual spend per category and month, with an optional note.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
