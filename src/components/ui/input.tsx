import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Mentor apply form — shows whether the field is public on Mentor Connect or internal only. */
  fieldVisibility?: "internal" | "public";
}

function FieldVisibilityBadge({ kind }: { kind: "internal" | "public" }) {
  if (kind === "internal") {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-fg bg-secondary px-1.5 py-0.5 rounded">
        Internal only
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-400 bg-primary-400/10 px-1.5 py-0.5 rounded">
      Public on Mentor Connect
    </span>
  );
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, fieldVisibility, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
              {label}
            </label>
            {fieldVisibility && <FieldVisibilityBadge kind={fieldVisibility} />}
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
