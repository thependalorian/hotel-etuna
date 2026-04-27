import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-content shadow-card hover:bg-brand-600 hover:shadow-card-hover",
        primary: "bg-primary text-primary-content shadow-card hover:bg-brand-600 hover:shadow-card-hover",
        destructive: "bg-semantic-error text-white hover:bg-semantic-error-dark",
        outline: "border border-base-300 bg-white/80 text-ink-800 hover:bg-brand-50 hover:border-brand-300",
        secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200",
        ghost: "text-ink-600 hover:bg-brand-50 hover:text-ink-950",
        link: "text-primary underline-offset-4 hover:underline",
        luxury: "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-card hover:from-brand-600 hover:to-brand-500",
        nude: "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-card hover:from-brand-600 hover:to-brand-500",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-xl px-8",
        xl: "h-14 rounded-md px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
  ({ className, variant, size, asChild = false, isLoading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
