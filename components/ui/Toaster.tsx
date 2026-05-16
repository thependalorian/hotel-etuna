/**
 * Toaster Component
 * 
 * Purpose: Toast notification renderer - displays all active toasts
 * Location: /components/ui/Toaster.tsx
 * 
 * Features:
 * - Renders all active toasts from useToast state
 * - Icon indicators for each variant
 * - Top-right viewport positioning
 * - Auto-dismiss functionality
 * - Optional action buttons
 * - Close button on each toast
 * 
 * Design:
 * - Icon + content layout with proper spacing
 * - Consistent variant styling (success, error, info, warning)
 * - Stacked vertically in viewport
 * 
 * Usage:
 * Add once to root layout:
 * ```tsx
 * // app/layout.tsx
 * import { Toaster } from "@/components/ui/Toaster"
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * Then use toast anywhere:
 * ```tsx
 * import { useToast } from "@/components/ui/use-toast"
 * 
 * const { toast } = useToast()
 * toast({ title: "Hello!" })
 * ```
 * 
 * @module Toaster
 */

"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  getToastIcon,
} from "@/components/ui/Toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getToastIcon(variant)}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
