"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UserMenu({
  variant = "full",
  align = "down",
}: {
  variant?: "full" | "compact";
  align?: "up" | "down";
}) {
  const { user, role } = useAuth();
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const onLogout = () => {
    setOpen(false);
    logout();
    router.replace("/login");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl text-left transition-colors hover:bg-slate-500/10",
          variant === "full" ? "w-full p-2" : "p-1",
        )}
      >
        <Avatar name={user.name} />
        {variant === "full" && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
              {user.name}
            </span>
            <span className="block text-xs text-slate-400">{role && ROLE_LABELS[role]}</span>
          </span>
        )}
        {variant === "full" && <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "glass-strong absolute z-20 w-52 rounded-xl p-1 shadow-xl",
              align === "up" ? "bottom-full mb-2" : "top-full mt-2",
              variant === "compact" ? "right-0" : "left-0",
            )}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {user.name}
              </p>
              {role && (
                <Badge tone="primary" className="mt-1">
                  {ROLE_LABELS[role]}
                </Badge>
              )}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" /> ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
