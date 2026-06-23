/**
 * Alert Component
 * 
 * Purpose: Accessible alert/notification component for important messages
 * Location: /components/ui/Alert.tsx
 * 
 * Features:
 * - Default and destructive variants
 * - ARIA role="alert" for screen readers
 * - Supports icons and structured content
 * - Alert title and description sub-components
 * 
 * Variants:
 * - default: Neutral informational alert
 * - destructive: Error or critical warning alert
 * 
 * Accessibility:
 * - Semantic role="alert" for announcements
 * - Proper heading hierarchy with AlertTitle
 * - Icon support with proper positioning
 * 
 * Usage:
 * ```tsx
 * <Alert variant="destructive">
 *   <AlertTitle>Error</AlertTitle>
 *   <AlertDescription>Something went wrong.</AlertDescription>
 * </Alert>
 * ```
 * 
 * @module Alert
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const alertVariants = cva(
  "relative w-full rounded-etuna-input border p-4 text-base-content [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-base-content",
  {
    variants: {
      variant: {
        default: "bg-base-100 text-base-content",
        destructive:
          "border-semantic-error/50 text-semantic-error dark:border-semantic-error [&>svg]:text-semantic-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
