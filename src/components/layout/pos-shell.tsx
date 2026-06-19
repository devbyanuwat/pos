"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import { POS_NAV, navForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const POS_ROLES: Role[] = ["staff", "manager", "owner"];

export function PosShell({ children }: { children: React.ReactNode }) {
  const { user, role } = useRequireAuth(POS_ROLES);
  const pathname = usePathname();

  if (!user || !role || !POS_ROLES.includes(role)) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  const items = navForRole(POS_NAV, role);

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <Brand />
          <nav className="ml-2 flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/pos"
                  ? pathname === "/pos"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-slate-600 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-white/10",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {(role === "manager" || role === "owner") && (
              <Link
                href="/admin"
                className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-500/10 sm:block dark:text-slate-300"
              >
                หลังร้าน
              </Link>
            )}
            <ThemeToggle />
            <UserMenu variant="compact" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
