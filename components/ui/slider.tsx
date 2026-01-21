"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import * as React from "react";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex data-vertical:flex-col items-center data-disabled:opacity-50 w-full data-vertical:w-auto data-vertical:h-full data-vertical:min-h-40 touch-none select-none">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative bg-muted rounded-full data-horizontal:w-full data-vertical:w-1 data-horizontal:h-1 data-vertical:h-full overflow-hidden select-none grow"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary data-vertical:w-full data-horizontal:h-full select-none"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block after:absolute relative after:-inset-2 bg-white disabled:opacity-50 border border-ring rounded-full focus-visible:outline-hidden ring-ring/50 hover:ring-[3px] focus-visible:ring-[3px] active:ring-[3px] size-3 transition-[color,box-shadow] disabled:pointer-events-none select-none shrink-0"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
