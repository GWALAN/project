import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default solid buttons
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        alternative: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-sm",
        dark: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
        light: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm",
        green: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
        red: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        yellow: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm",
        purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
        indigo: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
        orange: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",

        // Gradient buttons
        "gradient-blue": "text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm",
        "gradient-green": "text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-sm",
        "gradient-red": "text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-sm",
        "gradient-yellow": "text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-sm",
        "gradient-purple": "text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-sm",
        "gradient-indigo": "text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-sm",
        "gradient-pink": "text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-sm",
        "gradient-orange": "text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm",

        // Duotone gradients
        "gradient-purple-blue": "text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-sm",
        "gradient-cyan-blue": "text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-sm",
        "gradient-green-blue": "text-white bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-sm",
        "gradient-purple-pink": "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm",
        "gradient-pink-orange": "text-white bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 shadow-sm",
        "gradient-teal-lime": "text-white bg-gradient-to-r from-teal-500 to-lime-500 hover:from-teal-600 hover:to-lime-600 shadow-sm",
        "gradient-red-yellow": "text-white bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 shadow-sm",

        // Shadow buttons
        "shadow-blue": "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/50",
        "shadow-green": "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/50",
        "shadow-red": "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50",
        "shadow-yellow": "bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/50",
        "shadow-purple": "bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/50",
        "shadow-indigo": "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/50",
        "shadow-pink": "bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-500/50",
        "shadow-orange": "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-8 text-base",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };