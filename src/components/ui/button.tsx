import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-voxauth hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-white/10 active:scale-[0.98]",
        voxauth:
          "relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-semibold shadow-voxauth hover:-translate-y-0.5 hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-white/15 active:translate-y-0",
        voxauthOutline:
          "border border-purple-500/25 bg-background/60 text-foreground shadow-sm backdrop-blur-md hover:-translate-y-0.5 hover:border-purple-400/50 hover:bg-purple-950/20 hover:text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.25)] active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        outline:
          "border border-border/80 bg-card/60 backdrop-blur-md text-foreground shadow-sm hover:border-primary/40 hover:bg-accent/60 hover:text-foreground hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]",
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-sm hover:bg-secondary border border-border/50",
        ghost:
          "hover:bg-accent/60 hover:text-foreground hover:border-border/30",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-purple-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-7 text-[0.9375rem]",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
