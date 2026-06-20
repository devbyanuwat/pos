import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/constants";

// Teddy Boost badges: pill, weight 600, leading status dot, warm semantics.
const tones: Record<Tone, { box: string; dot: string }> = {
  neutral: {
    box: "bg-[#ede7da] text-[#5b6b61] dark:bg-white/10 dark:text-slate-200",
    dot: "bg-[#8e9b92]",
  },
  primary: {
    box: "bg-[#e7f0ea] text-[#1e5b38] dark:bg-[#1f7a44]/20 dark:text-emerald-200",
    dot: "bg-[#1f7a44]",
  },
  info: {
    box: "bg-[#e3eff5] text-[#2d6a8a] dark:bg-[#2d6a8a]/20 dark:text-sky-200",
    dot: "bg-[#2d6a8a]",
  },
  success: {
    box: "bg-[#e6f3eb] text-[#1f7a44] dark:bg-[#1f7a44]/20 dark:text-emerald-200",
    dot: "bg-[#1f7a44]",
  },
  warning: {
    box: "bg-[#fcf0d9] text-[#b97a10] dark:bg-[#b97a10]/20 dark:text-amber-200",
    dot: "bg-[#b97a10]",
  },
  danger: {
    box: "bg-[#fae7e5] text-[#b5443c] dark:bg-[#b5443c]/20 dark:text-red-200",
    dot: "bg-[#b5443c]",
  },
};

export function Badge({
  tone = "neutral",
  dot = true,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold",
        tones[tone].box,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-2 w-2 shrink-0 rounded-full", tones[tone].dot)} />}
      {children}
    </span>
  );
}
