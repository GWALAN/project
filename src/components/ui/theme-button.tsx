import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const themeButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        solid: "text-white hover:opacity-90",
        outline: "bg-transparent border-2 hover:bg-opacity-10",
        ghost: "bg-transparent hover:bg-opacity-10",
      },
      style: {
        rounded: "rounded-md",
        pill: "rounded-full",
        square: "rounded-none",
        floating: "rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1",
        glass: "backdrop-blur-md bg-opacity-20 hover:bg-opacity-30 border border-white/20",
        neon: "rounded-md shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.7)]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        xl: "h-12 px-8 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "solid",
      style: "rounded",
      size: "default"
    },
  }
);

export interface ThemeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof themeButtonVariants> {
  primary: string;
  background?: string;
  text?: string;
  asChild?: boolean;
}

const ThemeButton = React.forwardRef<HTMLButtonElement, ThemeButtonProps>(
  ({ className, variant, style, size, primary, background, text, asChild = false, ...props }, ref) => {
    const buttonStyles = {
      '--primary-rgb': primary.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(','),
      backgroundColor: variant === 'solid' ? primary : 'transparent',
      borderColor: variant === 'outline' ? primary : 'transparent',
      color: variant === 'solid' ? '#fff' : primary,
    } as React.CSSProperties;

    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(themeButtonVariants({ variant, style, size, className }))}
        ref={ref}
        style={buttonStyles}
        {...props}
      />
    );
  }
);
ThemeButton.displayName = "ThemeButton";

export { ThemeButton, themeButtonVariants };