import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
    
    const variants = {
      primary: "bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-md hover:shadow-orange-500/20 active:scale-[0.98]",
      secondary: "bg-[#1c212d] hover:bg-[#252c3c] text-slate-200 border border-[#2e374a] active:scale-[0.98]",
      outline: "bg-transparent border border-[#333d52] hover:border-orange-500/60 hover:text-orange-400 text-slate-300 active:scale-[0.98]",
      ghost: "bg-transparent hover:bg-[#1a1f2c] text-slate-300 hover:text-white",
      destructive: "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 active:scale-[0.98]",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
