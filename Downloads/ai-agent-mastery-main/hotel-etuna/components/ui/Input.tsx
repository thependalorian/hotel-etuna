import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Shown below the field when there is no error (muted). */
  helperText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;
    const hasError = error || props["aria-invalid"];

    // Build aria-describedby based on what's present
    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperTextId : null,
      props["aria-describedby"],
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-nude-800"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-semantic-error" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-nude-200 bg-surface-input px-4 py-3.5 font-sans text-base text-nude-900 transition-all duration-200",
            "placeholder:text-nude-400",
            "hover:border-nude-300",
            "focus:border-nude-500 focus:outline-none focus:ring-2 focus:ring-nude-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-nude-50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            hasError && "border-semantic-error focus:border-semantic-error focus:ring-semantic-error",
            className
          )}
          ref={ref}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={describedBy}
          aria-required={props.required ? true : undefined}
          {...props}
        />
        {helperText && !error ? (
          <p id={helperTextId} className="mt-1.5 text-sm text-nude-600">
            {helperText}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="mt-1.5 text-sm text-semantic-error-dark" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
