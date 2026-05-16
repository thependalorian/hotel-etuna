/**
 * Modal Component
 * 
 * Purpose: Accessible modal dialog system using Radix UI Dialog primitive
 * Location: /components/ui/Modal.tsx
 * 
 * Features:
 * - Overlay with backdrop blur
 * - Centered positioning with animations
 * - Keyboard navigation (ESC to close)
 * - Focus trap and focus return
 * - Close button with accessible label
 * - Composable header, content, footer structure
 * 
 * Components:
 * - Modal: Root component (wrapper)
 * - ModalTrigger: Button to open modal
 * - ModalContent: Main modal container
 * - ModalHeader: Header section
 * - ModalTitle: Dialog title (required for accessibility)
 * - ModalDescription: Optional description
 * - ModalFooter: Footer for actions
 * - ModalClose: Close button component
 * 
 * Design System:
 * - Shadow: luxury-strong
 * - Border: nude-200
 * - Background: surface-elevated
 * - Rounded: 3xl
 * - Animations: scale-in on open, fade-out on close
 * 
 * Accessibility:
 * - ARIA dialog role
 * - Focus management
 * - Keyboard support (ESC, Tab)
 * - Screen reader announcements
 * 
 * Usage:
 * ```tsx
 * <Modal>
 *   <ModalTrigger asChild>
 *     <Button>Open</Button>
 *   </ModalTrigger>
 *   <ModalContent>
 *     <ModalHeader>
 *       <ModalTitle>Title</ModalTitle>
 *       <ModalDescription>Description</ModalDescription>
 *     </ModalHeader>
 *     <ModalFooter>
 *       <Button>Confirm</Button>
 *     </ModalFooter>
 *   </ModalContent>
 * </Modal>
 * ```
 * 
 * @module Modal
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const Modal = DialogPrimitive.Root;

const ModalTrigger = DialogPrimitive.Trigger;

const ModalPortal = DialogPrimitive.Portal;

const ModalClose = DialogPrimitive.Close;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <ModalPortal>
    <ModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-surface-elevated p-8 shadow-luxury-strong rounded-3xl border border-nude-200",
        "data-[state=open]:animate-scale-in data-[state=closed]:animate-fade-out",
        "duration-200",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 rounded-full opacity-70 ring-offset-white transition-opacity hover:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-nude-500 focus:ring-offset-2",
          "disabled:pointer-events-none data-[state=open]:bg-nude-100",
          "h-10 w-10 flex items-center justify-center hover:bg-nude-50"
        )}
        aria-label="Close dialog"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </ModalPortal>
));
ModalContent.displayName = DialogPrimitive.Content.displayName;

const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
ModalHeader.displayName = "ModalHeader";

const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-2xl font-semibold leading-none tracking-tight text-nude-900",
      className
    )}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-base text-nude-600", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};
