/**
 * Button Component
 *
 * Purpose: Primary interactive button following Hotel Etuna design system
 * Location: /components/ui/Button.tsx
 *
 * Features:
 * - Psychology-driven sizing (Fitt's Law: min 44px touch targets)
 * - Multiple variants: primary, secondary, outline, ghost, destructive, luxury
 * - Loading states with spinner
 * - Hover/focus/active states with scale animation
 * - Keyboard accessible
 *
 * Design System:
 * - Primary CTA: CI Rustic Red (`ci-primary`) with cream text
 * - Touch targets: 44px minimum (mobile), 32px desktop
 * - Rounded-full for modern, friendly feel
 *
 * @module Button
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /** Hotel Etuna primary CTA — CI Rustic Red */
        default:
          "bg-ci-primary text-ci-cream shadow-md hover:bg-ci-primary/90 ",
        primary:
          "bg-ci-primary text-ci-cream shadow-md hover:bg-ci-primary/90 ",
        secondary:
          "bg-ci-secondary-chocolate text-ci-cream shadow-md hover:bg-ci-accent-terracotta ",
        outline:
          "border-2 border-ci-primary bg-transparent text-ci-primary hover:bg-ci-cream hover:border-ci-primary",
        ghost:
          "text-ci-secondary-chocolate hover:bg-ci-cream hover:text-ci-accent-terracotta",
        destructive:
          "bg-semantic-error text-white shadow-md hover:bg-semantic-error-dark ",
        luxury:
          "bg-gradient-to-r from-ci-secondary-gold to-ci-accent-gold text-ci-cream shadow-nude-medium ",
        chip: "!rounded-etuna-button border border-nude-900 bg-transparent font-medium text-ink-900 hover:bg-nude-50 shadow-none",
      },
      size: {
        sm: "h-11 min-h-11 px-4 text-sm md:h-9 md:min-h-9",
        md: "h-11 min-h-11 px-6 text-base md:h-11 md:min-h-11",
        lg: "h-12 min-h-12 px-10 text-lg md:h-14 md:min-h-14",
        default: "h-11 min-h-11 px-6 text-base md:h-11 md:min-h-11",
        xl: "h-12 min-h-12 px-10 text-lg md:h-14 md:min-h-14",
        icon: "h-11 min-h-11 w-11 min-w-11 shrink-0 p-0 rounded-full md:h-11 md:min-h-11 md:w-11 md:min-w-11",
        chip: "h-auto min-h-0 rounded-etuna-button px-4 py-2.5 text-body",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), "animate-scale-in", className)}
        ref={ref}
        disabled={isLoading || disabled}
        aria-busy={isLoading ? true : undefined}
        aria-live={isLoading ? "polite" : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Loading...</span>
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
