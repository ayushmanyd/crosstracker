import type { Metadata } from "next";
import { Tags } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { verifySession } from "@/server/dal";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await verifySession();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Categories"
        description="The buckets your plans and actuals belong to."
      />
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tags />
          </EmptyMedia>
          <EmptyTitle>No categories yet</EmptyTitle>
          <EmptyDescription>
            Create spending categories like Marketing, Payroll, or Tools.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
