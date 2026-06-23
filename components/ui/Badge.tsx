/**
 * Badge Component
 *
 * Purpose: Small inline status/label pill (categories, dietary tags, "Popular").
 * Location: /components/ui/Badge.tsx
 *
 * Variants: primary, secondary, success, warning, destructive, outline
 * Sizes: sm, md
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-ci-cream text-ci-accent-terracotta",
        secondary: "bg-ci-secondary-tan/40 text-ci-secondary-chocolate",
        featured:
          "rounded-etuna-badge bg-white px-2.5 py-1.5 text-caption font-semibold text-ink-900 shadow-etuna-control",
        success: "bg-green-100 text-green-800",
        warning: "bg-amber-100 text-amber-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-nude-300 text-ink-700",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { badgeVariants };
