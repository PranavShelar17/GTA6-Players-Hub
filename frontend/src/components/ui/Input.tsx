import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full rounded-lg bg-[#141722] border border-[#232938] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
