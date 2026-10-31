"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-400 text-white hover:bg-primary-500 hover:-translate-y-0.5",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-border bg-transparent text-gray-700 hover:bg-secondary hover:border-primary-line hover:text-primary-400",
        secondary:
          "bg-secondary text-secondary-fg hover:bg-gray-200",
        ghost:
          "text-muted-fg hover:text-primary-400 hover:bg-primary-soft",
        link: "text-primary-400 underline-offset-4 hover:underline p-0 h-auto",
        "outline-dark":
          "border border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm",
        "primary-dark":
          "bg-white text-primary-800 hover:bg-accent hover:-translate-y-0.5",
        gold:
          "bg-amber-500 text-white hover:bg-amber-600 hover:-translate-y-0.5",
        /**
         * The /pricing CTA treatment: brand blue gradient, flipping to a green ->
         * blue gradient on hover. Pair it with `rounded-full` at the call site for
         * the pill shape — the radius lives in `size`, and twMerge lets a caller's
         * `rounded-full` win.
         */
        gradient:
          "bg-gradient-to-r from-primary-400 to-primary-700 text-white shadow-[0_10px_28px_-12px_rgba(50,128,255,0.85)] hover:from-emerald-500 hover:to-primary-400 hover:shadow-[0_10px_28px_-12px_rgba(16,185,129,0.8)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm rounded-lg",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-7 text-base rounded-lg",
        xl: "h-12 px-6 text-base rounded-xl sm:h-14 sm:px-9 sm:text-lg w-full sm:w-auto",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
