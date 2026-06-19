"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact +/- quantity control. Clamps to [min, max]. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const upper = max ?? Infinity;
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(upper, value + 1));

  const btn =
    size === "sm"
      ? "h-8 w-8"
      : "h-10 w-10";
  const text = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-slate-300/70 bg-white/60 dark:border-white/15 dark:bg-white/5",
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="ลดจำนวน"
        className={cn(
          "flex items-center justify-center rounded-l-xl text-slate-600 transition-colors hover:bg-slate-500/10 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10",
          btn,
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className={cn(
          "min-w-9 text-center font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-50",
          text,
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= upper}
        aria-label="เพิ่มจำนวน"
        className={cn(
          "flex items-center justify-center rounded-r-xl text-slate-600 transition-colors hover:bg-slate-500/10 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10",
          btn,
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
