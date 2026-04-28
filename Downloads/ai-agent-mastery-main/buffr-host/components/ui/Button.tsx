import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nude-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        /** Alias for legacy usage — same as primary */
        default: "bg-nude-600 text-white shadow-md hover:bg-nude-700 hover:shadow-nude-medium",
        primary: "bg-nude-600 text-white shadow-md hover:bg-nude-700 hover:shadow-nude-medium",
        secondary: "bg-nude-700 text-white shadow-md hover:bg-nude-800 hover:shadow-nude-medium",
        outline: "border border-nude-300 bg-transparent text-nude-700 hover:bg-nude-50 hover:border-nude-400",
        ghost: "text-nude-700 hover:bg-nude-100 hover:text-nude-800",
        destructive: "bg-semantic-error text-white shadow-md hover:bg-semantic-error-dark hover:shadow-nude-medium",
        luxury: "bg-gradient-to-r from-luxury-charlotte to-luxury-rose text-white shadow-nude-medium hover:shadow-luxury-medium hover:from-nude-700 hover:to-luxury-charlotte",
      },
      size: {
        sm: "h-9 min-h-9 px-3 text-sm lg:min-h-8",
        md: "h-11 min-h-11 px-5 text-base lg:min-h-10",
        lg: "h-14 min-h-14 px-8 text-lg lg:min-h-12",
        /** Legacy / marketing */
        default: "h-11 min-h-11 px-5 text-base lg:min-h-10",
        xl: "h-14 min-h-14 px-10 text-lg lg:min-h-12",
        icon: "h-11 min-h-11 w-11 min-w-11 shrink-0 p-0 lg:h-10 lg:min-h-10 lg:w-10 lg:min-w-10",
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
