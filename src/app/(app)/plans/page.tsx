import type { Metadata } from "next";
import { Target } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { verifySession } from "@/server/dal";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage() {
  await verifySession();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Plans"
        description="Monthly spending targets per category."
      />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Target />
          </EmptyMedia>
          <EmptyTitle>No plans yet</EmptyTitle>
          <EmptyDescription>
            Set a target per category and month - for example Marketing, $5,000
            for January.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
