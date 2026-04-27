import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, ...props }, ref) => {
    const hasError = props["aria-invalid"];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="mb-1.5 block text-sm font-semibold text-ink-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-base-300 bg-white/85 px-3.5 py-2 text-sm text-ink-900 shadow-xs ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-400 hover:border-brand-300 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-base-200 disabled:opacity-70",
            hasError && "border-semantic-error focus-visible:ring-semantic-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "mt-1.5 text-sm text-ink-500",
              hasError && "text-semantic-error"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
