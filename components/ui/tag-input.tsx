"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type TagInputProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
};

export function TagInput({
  value,
  onValueChange,
  placeholder = "Add a tag…",
  maxTags,
  allowDuplicates = false,
  disabled = false,
  className,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const addTag = React.useCallback(
    (raw: string) => {
      const next = raw.trim();

      if (!next) {
        return;
      }

      if (!allowDuplicates && value.includes(next)) {
        setInputValue("");
        return;
      }

      if (typeof maxTags === "number" && value.length >= maxTags) {
        setInputValue("");
        return;
      }

      onValueChange([...value, next]);
      setInputValue("");
    },
    [allowDuplicates, maxTags, onValueChange, value],
  );

  const removeTag = React.useCallback(
    (tag: string) => {
      onValueChange(value.filter((item) => item !== tag));
    },
    [onValueChange, value],
  );

  return (
    <div
      data-slot="tag-input"
      className={cn(
        "flex flex-wrap items-center gap-2 bg-transparent dark:bg-input/30 px-2.5 py-2 border border-input aria-invalid:border-destructive aria-invalid:focus-within:border-destructive focus-within:border-ring dark:aria-invalid:border-destructive/50 rounded-md aria-invalid:focus-within:ring-destructive/50 focus-within:ring-[3px] focus-within:ring-ring/50 w-full min-h-10 text-foreground",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="group/badge relative ps-2 pe-1 border-none rounded-md h-7 font-medium text-secondary-foreground text-xs transition-colors"
        >
          <span className="max-w-56 truncate">{tag}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => removeTag(tag)}
            disabled={disabled}
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3.5" />
          </Button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag(inputValue);
            return;
          }

          if (event.key === "Backspace" && inputValue.length === 0) {
            onValueChange(value.slice(0, -1));
          }
        }}
        onBlur={() => {
          if (disabled) {
            return;
          }

          if (inputValue.trim().length > 0) {
            addTag(inputValue);
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 w-[10ch] min-w-[10ch] h-7"
      />
    </div>
  );
}
