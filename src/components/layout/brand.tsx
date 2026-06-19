"use client";

import { Store } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Brand({ compact, className }: { compact?: boolean; className?: string }) {
  const shopName = useStore((s) => s.settings.shopName);
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-primary/30">
        <Store className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {shopName}
        </span>
      )}
    </div>
  );
}
