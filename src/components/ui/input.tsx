import * as React from "react";
import { cn } from "@/lib/utils";

// Teddy Boost inputs: 1.5px border, 12px radius, white field, green focus ring.
const base =
  "flex h-11 w-full rounded-xl border-[1.5px] border-[#d8ddd4] bg-white px-4 text-[15px] text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#1f7a44] focus:shadow-[0_0_0_3px_rgba(31,122,68,0.18)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-400";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "h-auto min-h-20 py-2.5 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-slate-600 dark:text-slate-300", className)}
      {...props}
    />
  );
}
