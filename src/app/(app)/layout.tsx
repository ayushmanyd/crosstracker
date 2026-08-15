import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUser } from "@/server/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar email={user.email} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-5 backdrop-blur-sm">
          <SidebarTrigger />
          <span className="text-sm font-semibold lg:hidden">CrossTracker</span>
          <div className="ml-auto flex items-center">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 px-5 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
