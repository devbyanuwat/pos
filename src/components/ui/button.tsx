import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-indigo-500 hover:shadow-primary/30",
        secondary: "bg-sky-500 text-white shadow-md hover:bg-sky-400",
        outline:
          "border border-slate-300/70 bg-white/50 text-slate-700 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
        ghost:
          "text-slate-600 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-white/10",
        danger: "bg-red-500 text-white shadow-md hover:bg-red-400",
        success: "bg-emerald-500 text-white shadow-md hover:bg-emerald-400",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { button as buttonVariants };
