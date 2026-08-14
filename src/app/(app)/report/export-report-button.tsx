import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExportReportButton({ from, to }: { from: string; to: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-2"
      render={<a href={`/report/export?from=${from}&to=${to}`} download />}
      nativeButton={false}
    >
      <Download className="size-4" />
      <span>Export CSV</span>
    </Button>
  );
}
