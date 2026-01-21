"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import * as React from "react";

export type OptionType = {
  label: string;
  value: string;
  category?: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  grouped?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleziona opzioni",
  className,
  grouped = false,
  invalid = false,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const groupedOptions = React.useMemo(() => {
    if (!grouped) return { "": options };

    return options.reduce<Record<string, OptionType[]>>((acc, option) => {
      const category = option.category || "";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    }, {});
  }, [options, grouped]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid}
            disabled={disabled}
            className={cn(
              "justify-between w-full h-auto min-h-10",
              "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]",
              selected.length > 0 ? "px-3 py-2" : "",
              className,
            )}
          />
        }
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 && placeholder}
          {selected.map((item) => (
            <Badge
              variant="secondary"
              key={item}
              className="mr-1 mb-1"
              onClick={(e) => {
                e.stopPropagation();
                handleUnselect(item);
              }}
            >
              {options.find((option) => option.value === item)?.label || item}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${
                  options.find((option) => option.value === item)?.label || item
                }`}
                className="ml-1 rounded-full outline-hidden focus:ring-2 focus:ring-ring ring-offset-background focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnselect(item);
                }}
              >
                <X className="w-3 h-3 hover:text-foreground" />
              </span>
            </Badge>
          ))}
        </div>
        <ChevronDown className="opacity-50 ml-2 w-4 h-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Cerca opzione..." />
          <CommandList className="w-full">
            <CommandEmpty>Nessuna opzione trovata.</CommandEmpty>
            {Object.entries(groupedOptions).map(
              ([category, categoryOptions]) => (
                <React.Fragment key={category || "default"}>
                  {grouped && category && (
                    <CommandGroup className="relative [&]:overflow-visible">
                      <div className="top-0 right-0 left-0 z-10 sticky bg-background px-2 py-1.5 w-full font-bold text-muted-foreground text-xs">
                        {category}
                      </div>
                      {categoryOptions.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleSelect(option.value)}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={cn(
                                "flex justify-center items-center border border-primary rounded-sm size-4",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span>{option.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                  {!grouped && (
                    <CommandGroup>
                      {categoryOptions.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleSelect(option.value)}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={cn(
                                "flex justify-center items-center border border-primary rounded-sm size-4",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span>{option.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                  {category !== Object.keys(groupedOptions).slice(-1)[0] && (
                    <CommandSeparator />
                  )}
                </React.Fragment>
              ),
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
