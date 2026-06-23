/**
 * Input Component
 * 
 * Purpose: Accessible form input field with label, helper text, and error states
 * Location: /components/ui/Input.tsx
 * 
 * Features:
 * - Optional label with required indicator
 * - Helper text for guidance
 * - Error state with error message
 * - Hover, focus, and disabled states
 * - File input support
 * - Full ARIA attribute support
 * 
 * Design System:
 * - Height: 44px (h-11) - Follows Fitt's Law
 * - Rounded: etuna-input (14px) per DS §6 radius vocabulary
 * - Border: nude-200 (default), semantic-error (error state)
 * - Focus ring: 2px ci-primary with offset (DS §9.3)
 * - Transitions: 200ms duration
 * 
 * Accessibility:
 * - Proper label association via htmlFor
 * - Required indicator with aria-label
 * - Error announcements via role="alert"
 * - Helper text connected via aria-describedby
 * - Auto-generated IDs for a11y
 * 
 * Props:
 * - label?: Label text above input
 * - helperText?: Guidance text below input
 * - error?: Error message (replaces helperText)
 * - All standard input attributes
 * 
 * Usage:
 * ```tsx
 * <Input 
 *   label="Email" 
 *   type="email"
 *   helperText="We'll never share your email"
 *   error={errors.email}
 *   required
 * />
 * ```
 * 
 * @module Input
 */

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
            className="mb-2 block text-sm font-semibold text-ink-800"
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
            "flex h-11 w-full rounded-etuna-input border border-nude-200 bg-surface-input px-4 py-3.5 font-sans text-base text-ink-900 transition-all duration-200",
            "placeholder:text-ink-400",
            "hover:border-nude-300",
            "focus:border-ci-primary focus:outline-none focus:ring-2 focus:ring-ci-primary focus:ring-offset-2",
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
          <p id={helperTextId} className="mt-1.5 text-sm text-ink-600">
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
