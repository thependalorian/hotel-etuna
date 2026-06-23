/**
 * Card Component
 * 
 * Purpose: Container component for content sections with consistent elevation and styling
 * Location: /components/ui/Card.tsx
 * 
 * Features:
 * - Multiple elevation variants (default, elevated, luxury, interactive)
 * - Flexible padding sizes (none, sm, md, lg, xl)
 * - Nude color palette with warm shadows
 * - Hover states for interactive cards
 * - Modular subcomponents (Header, Title, Description, Content, Footer)
 * 
 * Design System:
 * - Background: surface-elevated (white)
 * - Border: nude-200
 * - Elevation: flat by default (no shadow); etuna-elevated on floating UI only (DS §7)
 * - Border radius: etuna-card (20px) per DS §6 radius vocabulary
 * - Typography: Playfair Display for titles, Inter for descriptions
 * 
 * Variants:
 * - flat (default): no shadow — border + surface colour (browse/ops cards)
 * - listing: flat, borderless, overflow-hidden (marketing tiles)
 * - elevated: shadow-etuna-elevated (floating UI only)
 * - luxury: gradient + luxury-soft shadow (VIP / marketing hero only)
 * - interactive: hover border + active scale (clickable cards)
 * 
 * Padding:
 * - none: p-0 (custom padding needed)
 * - sm: 16px mobile / 20px desktop
 * - md: 20px mobile / 24px desktop (default)
 * - lg: 24px mobile / 32px desktop
 * - xl: 32px mobile / 40px desktop
 * 
 * Subcomponents:
 * - CardHeader: Title + description container
 * - CardTitle: H3 heading (lg/xl, Playfair Display)
 * - CardDescription: Subtitle (sm, nude-600)
 * - CardContent: Main content area
 * - CardFooter: Action buttons or metadata
 * 
 * Psychology Principles:
 * - Gestalt Closure: Rounded corners help define boundaries
 * - Proximity: Related content grouped within card
 * - Halo Effect: Subtle shadows create depth, premium feel
 * - Doherty Threshold: Hover transitions <200ms
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - WCAG AA contrast (nude-900 on white)
 * - Keyboard navigation (when interactive)
 * - Screen reader friendly
 * 
 * Usage:
 * ```tsx
 * <Card variant="elevated" padding="lg">
 *   <CardHeader>
 *     <CardTitle>Room Details</CardTitle>
 *     <CardDescription>Premium Suite Information</CardDescription>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 *   <CardFooter>...</CardFooter>
 * </Card>
 * ```
 * 
 * @module Card
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "border border-nude-200 bg-surface-elevated rounded-etuna-card transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-none",
        flat: "shadow-none",
        listing: "overflow-hidden rounded-etuna-card border-0 shadow-none",
        elevated: "shadow-etuna-elevated",
        luxury:
          "bg-gradient-to-br from-luxury-champagne to-white border-luxury-charlotte shadow-luxury-soft",
        interactive:
          "cursor-pointer hover:border-nude-300 active:scale-[0.99]",
      },
      padding: {
        none: "p-0",
        sm: "p-4 md:p-5",
        md: "p-5 md:p-6",
        lg: "p-6 md:p-8",
        xl: "p-8 lg:p-10",
      },
    },
    defaultVariants: {
      variant: "flat",
      padding: "md",
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-lg md:text-xl font-semibold leading-tight tracking-tight text-ink-900", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-ink-600 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
