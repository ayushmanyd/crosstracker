import type { Metadata } from "next";
import { Tags } from "lucide-react";

import { CategoryActions } from "@/components/categories/category-actions";
import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listCategories } from "@/server/categories/queries";

export const metadata: Metadata = { title: "Categories" };

function formatAddedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="The buckets your plans and actuals belong to."
      />

      <Card>
        <CardContent>
          <CreateCategoryForm />
        </CardContent>
      </Card>

      {categories.length === 0 ? (
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
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatAddedDate(category.createdAt)}
                    </p>
                  </div>
                  <CategoryActions id={category.id} name={category.name} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
