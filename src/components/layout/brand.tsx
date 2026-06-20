"use client";

import { Coffee } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Brand({ compact, className }: { compact?: boolean; className?: string }) {
  const shopName = useStore((s) => s.settings.shopName);
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1f7a44] text-[#f0c58f] shadow-sm ring-2 ring-[#f0c58f]/50">
        <Coffee className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="font-accent text-2xl leading-none text-[#1f7a44] dark:text-[#f0c58f]">
          {shopName}
        </span>
      )}
    </div>
  );
}
