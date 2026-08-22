import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-soft text-primary-800 border border-primary-line",
        secondary: "bg-secondary text-secondary-fg",
        outline: "border border-border text-gray-600",
        success: "bg-green-50 text-green-700 border border-green-200",
        warning: "bg-amber-50 text-amber-700 border border-amber-200",
        danger: "bg-red-50 text-red-700 border border-red-200",
        starter: "bg-green-50 text-green-700 border border-green-200",
        pro: "bg-blue-50 text-blue-700 border border-blue-200",
        elite: "bg-amber-50 text-amber-700 border border-amber-200",
        mentor: "bg-violet-50 text-violet-700 border border-violet-200",
        dark: "bg-white/10 text-white border border-white/20",
      },
      size: {
        default: "px-2.5 py-0.5",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
