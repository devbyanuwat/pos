import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-xl border-[1.5px] border-[#d8ddd4] bg-white pl-4 pr-9 text-[15px] text-slate-900 transition-colors focus:border-[#1f7a44] focus:shadow-[0_0_0_3px_rgba(31,122,68,0.18)] focus-visible:outline-none disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
));
Select.displayName = "Select";
