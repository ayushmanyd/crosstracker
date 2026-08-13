"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, LogOut, Receipt, Tags, Target } from "lucide-react";

import { logout } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const LINKS = [
  { href: "/report", label: "Report", icon: ChartColumn },
  { href: "/plans", label: "Plans", icon: Target },
  { href: "/actuals", label: "Actuals", icon: Receipt },
  { href: "/categories", label: "Categories", icon: Tags },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="h-16 justify-center border-b px-5">
        <Link
          href="/report"
          className="w-fit text-lg font-bold tracking-tight"
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          CrossTracker
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {LINKS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={pathname.startsWith(href)}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Separator className="mb-3" />
        <p className="truncate px-2 pb-2 text-xs text-muted-foreground">
          {email}
        </p>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut data-icon="inline-start" />
            Log out
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
