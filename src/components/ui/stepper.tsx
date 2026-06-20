"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Teddy Boost order-status stepper (topic 8).
 * `current` is the 0-based index of the active step; earlier steps are "done".
 */
export function Stepper({
  steps,
  current,
  cancelled,
  className,
}: {
  steps: string[];
  current: number;
  cancelled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start", className)}>
      {steps.map((label, i) => {
        const done = !cancelled && i < current;
        const active = !cancelled && i === current;
        const isLast = i === steps.length - 1;
        return (
          <div key={label} className={cn("flex items-start", isLast ? "flex-none" : "flex-1")}>
            <div className="flex w-[72px] flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  cancelled
                    ? "bg-[#b5443c] text-white"
                    : done
                      ? "bg-[#1f7a44] text-white"
                      : active
                        ? "bg-[#f0c58f] text-[#143d26] ring-4 ring-[#f0c58f]/40"
                        : "bg-[#dde3dd] text-white dark:bg-white/15",
                )}
              >
                {cancelled ? (
                  <X className="h-4 w-4" />
                ) : done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "text-xs leading-tight",
                  done || active
                    ? "font-semibold text-slate-700 dark:text-slate-200"
                    : "text-slate-400",
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={cn(
                  "mx-1 mt-4 h-0.5 flex-1 rounded-full",
                  done ? "bg-[#1f7a44]" : "bg-[#dde3dd] dark:bg-white/15",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
