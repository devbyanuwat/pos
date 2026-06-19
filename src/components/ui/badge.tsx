import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

const tones: Record<Tone, string> = {
  neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  primary: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  info: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-600 dark:text-red-300",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
