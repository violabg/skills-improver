"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer after:absolute relative after:-inset-x-3 after:-inset-y-2 flex justify-center items-center data-checked:bg-primary dark:bg-input/30 dark:data-checked:bg-primary disabled:opacity-50 group-has-disabled/field:opacity-50 border border-input data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 rounded-[4px] outline-none aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 size-4 data-checked:text-primary-foreground transition-colors disabled:cursor-not-allowed shrink-0",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="place-content-center grid [&>svg]:size-3.5 text-current transition-none"
      >
        <Check className="w-3.5 h-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
