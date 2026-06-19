"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-auth";
import { ADMIN_NAV, navForRole, type NavItem } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const ADMIN_ROLES: Role[] = ["manager", "owner"];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-slate-600 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-white/10",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, role } = useRequireAuth(ADMIN_ROLES);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || !role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  const items = navForRole(ADMIN_NAV, role);

  return (
    <div className="min-h-dvh">
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-4 border-r border-white/40 p-4 md:flex dark:border-white/10">
        <Brand />
        <NavList items={items} pathname={pathname} />
        <div className="flex items-center gap-1 border-t border-slate-200/60 pt-2 dark:border-white/10">
          <div className="min-w-0 flex-1">
            <UserMenu variant="full" align="up" />
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <header className="glass sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="เปิดเมนู"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-500/10"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand compact />
        <ThemeToggle />
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="glass-strong absolute inset-y-0 left-0 flex w-72 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="ปิดเมนู"
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-500/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList items={items} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-slate-200/60 pt-2 dark:border-white/10">
              <UserMenu variant="full" align="up" />
            </div>
          </aside>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
