import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-khaki-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /** Hotel Etuna primary CTA */
        default: "bg-khaki-600 text-white shadow-md hover:bg-khaki-700 hover:shadow-nude-medium",
        primary: "bg-khaki-600 text-white shadow-md hover:bg-khaki-700 hover:shadow-nude-medium",
        secondary: "bg-terracotta-800 text-white shadow-md hover:bg-terracotta-900 hover:shadow-nude-medium",
        outline: "border-2 border-khaki-600 bg-transparent text-khaki-700 hover:bg-khaki-50 hover:border-khaki-700",
        ghost: "text-terracotta-800 hover:bg-nude-100 hover:text-terracotta-900",
        destructive: "bg-semantic-error text-white shadow-md hover:bg-semantic-error-dark hover:shadow-nude-medium",
        luxury: "bg-gradient-to-r from-luxury-gold to-khaki-sand text-white shadow-nude-medium hover:shadow-luxury-medium",
      },
      size: {
        sm: "h-11 min-h-11 px-4 text-sm md:h-9 md:min-h-9",
        md: "h-11 min-h-11 px-6 text-base md:h-11 md:min-h-11",
        lg: "h-12 min-h-12 px-10 text-lg md:h-14 md:min-h-14",
        /** Legacy / marketing */
        default: "h-11 min-h-11 px-6 text-base md:h-11 md:min-h-11",
        xl: "h-12 min-h-12 px-10 text-lg md:h-14 md:min-h-14",
        icon: "h-11 min-h-11 w-11 min-w-11 shrink-0 p-0 rounded-full md:h-11 md:min-h-11 md:w-11 md:min-w-11",
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
