import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="absolute right-4 top-4 md:right-8">
        <ThemeToggle />
      </div>
      <Link
        href="/"
        className="mb-10 text-xl font-bold tracking-tight text-foreground"
      >
        CrossTracker
      </Link>
      <div className="w-full max-w-105">{children}</div>
      <p className="mt-10 text-xs text-muted-foreground">
        Budget tracking made simple.
      </p>
    </div>
  );
}
