import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Teddy Boost buttons: pill radius, weight 600, warm palette.
const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-150 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-[#1f7a44] text-[#fffdf8] shadow-sm hover:bg-[#1e5b38]",
        secondary: "bg-[#f0c58f] text-[#143d26] shadow-sm hover:bg-[#ecb976]",
        outline:
          "border-2 border-[#1f7a44] bg-transparent text-[#1f7a44] hover:bg-[#1f7a44]/10 dark:text-[#f0c58f] dark:border-[#f0c58f]",
        ghost:
          "bg-transparent text-[#1f7a44] hover:bg-[#1f7a44]/10 dark:text-[#f0c58f] dark:hover:bg-white/10",
        danger: "bg-[#b5443c] text-white shadow-sm hover:bg-[#9e3a33]",
        success: "bg-[#1f7a44] text-white shadow-sm hover:bg-[#1e5b38]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[15px]",
        lg: "h-12 px-8 text-base",
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
