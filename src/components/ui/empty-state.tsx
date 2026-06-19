import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-400">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
