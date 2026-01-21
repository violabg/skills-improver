"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";
import { CircleIcon } from "lucide-react";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("gap-2 grid w-full", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer after:absolute relative after:-inset-x-3 after:-inset-y-2 flex dark:bg-input/30 disabled:opacity-50 border border-input aria-invalid:border-destructive focus-visible:border-ring dark:aria-invalid:border-destructive/50 rounded-full outline-none aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 size-4 aspect-square text-primary disabled:cursor-not-allowed shrink-0",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex justify-center items-center size-4 text-primary group-aria-invalid/radio-group-item:text-destructive"
      >
        <CircleIcon className="top-1/2 left-1/2 absolute fill-current size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
