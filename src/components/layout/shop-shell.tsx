"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { useRequireAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/types";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const SHOP_ROLES: Role[] = ["customer", "staff", "manager", "owner"];

const LINKS = [
  { href: "/shop", label: "ร้านค้า" },
  { href: "/account", label: "บัญชีของฉัน" },
];

export function ShopShell({ children }: { children: React.ReactNode }) {
  const { user } = useRequireAuth(SHOP_ROLES);
  const cartCount = useStore((s) => s.cart.reduce((a, c) => a + c.qty, 0));
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/shop" aria-label="หน้าร้าน">
            <Brand />
          </Link>
          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-white/10",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/cart"
              aria-label="ตะกร้าสินค้า"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-500/10 dark:text-slate-300"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <UserMenu variant="compact" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
