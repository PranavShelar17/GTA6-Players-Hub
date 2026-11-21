import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Failed to load content. Please verify your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 rounded-xl border border-rose-900/30 bg-rose-950/10", className)}>
      <div className="mb-3 p-2.5 rounded-full bg-rose-900/20 text-rose-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-rose-200 mb-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
}
