import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Mentor apply and similar forms — shows whether the field is internal or public. */
  visibility?: "internal" | "public";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, visibility, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {visibility === "internal" && (
              <span className="text-[11px] font-medium text-muted-fg">Internal</span>
            )}
            {visibility === "public" && (
              <span className="text-[11px] font-medium text-primary-400">Public on Mentor Connect</span>
            )}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm",
            "placeholder:text-muted-fg",
            "focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-muted-fg">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
