import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTone = "primary" | "success" | "danger" | "info" | "warning" | "neutral";

const tints: Record<StatTone, string> = {
  primary: "text-indigo-500 bg-indigo-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
  danger: "text-red-500 bg-red-500/10",
  info: "text-sky-500 bg-sky-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  neutral: "text-slate-500 bg-slate-500/10",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: React.ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              tints[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
