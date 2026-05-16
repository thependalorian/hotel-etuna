/**
 * Textarea Component
 * 
 * Purpose: Multi-line text input with label and error states
 * Location: /components/ui/Textarea.tsx
 * 
 * Features:
 * - Optional label with required indicator
 * - Error state with error message
 * - Vertical resize capability
 * - Hover, focus, and disabled states
 * - Full ARIA attribute support
 * 
 * Design System:
 * - Min height: 120px (5 rows default)
 * - Rounded: xl (12px)
 * - Border: nude-200 (default), semantic-error (error state)
 * - Focus ring: 2px with offset
 * - Transitions: 200ms duration
 * 
 * Accessibility:
 * - Proper label association via htmlFor
 * - Required indicator with aria-label
 * - Error announcements via role="alert"
 * - Auto-generated IDs for a11y
 * - aria-invalid and aria-describedby support
 * 
 * Props:
 * - label?: Label text above textarea
 * - error?: Error message
 * - All standard textarea attributes (rows, cols, maxLength, etc.)
 * 
 * Usage:
 * ```tsx
 * <Textarea 
 *   label="Description" 
 *   rows={8}
 *   error={errors.description}
 *   required
 * />
 * ```
 * 
 * @module Textarea
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const hasError = error || props["aria-invalid"];

    // Build aria-describedby based on what's present
    const describedBy = [
      error ? errorId : null,
      props["aria-describedby"],
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border border-nude-200 bg-surface-input px-4 py-3 font-sans text-base text-nude-900 transition-all duration-200",
            "placeholder:text-nude-400",
            "hover:border-nude-300",
            "focus:border-nude-500 focus:outline-none focus:ring-2 focus:ring-nude-500 focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-nude-50",
            "resize-vertical",
            hasError && "border-semantic-error focus:border-semantic-error focus:ring-semantic-error",
            className
          )}
          ref={ref}
          rows={5}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={describedBy}
          aria-required={props.required ? true : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-semantic-error-dark" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
