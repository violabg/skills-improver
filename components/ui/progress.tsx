"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-secondary rounded-full w-full h-4 overflow-hidden",
      className,
    )}
    {...props}
  >
    <div
      className="flex-1 bg-primary w-full h-full transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
Progress.displayName = "Progress";

export { Progress };
