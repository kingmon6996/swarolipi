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
          "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-swarolipi hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-white/10 active:scale-[0.98]",
        swarolipi:
          "relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-semibold shadow-swarolipi hover:-translate-y-0.5 hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-white/15 active:translate-y-0",
        swarolipiOutline:
          "relative overflow-hidden border border-white/20 bg-gradient-to-b from-white/15 via-white/5 to-white/10 backdrop-blur-2xl text-white font-semibold shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),0_8px_32px_0_rgba(0,0,0,0.4),0_0_20px_rgba(139,92,246,0.25)] hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:text-white hover:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.5),0_0_30px_rgba(168,85,247,0.45)] active:translate-y-0 active:bg-white/10 transition-all duration-300",
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
