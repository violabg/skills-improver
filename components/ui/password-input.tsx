"use client";

import { cn } from "@/lib/utils";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const id = useId();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  return (
    <div className="relative">
      <Input
        id={id}
        className={cn("pe-12", className)}
        placeholder="Password"
        type={isVisible ? "text" : "password"}
        {...props}
      />
      <button
        className="focus:z-10 absolute inset-y-0 flex justify-center items-center hover:bg-accent disabled:opacity-50 focus-visible:border-ring rounded-e-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 w-12 h-full text-muted-foreground/80 hover:text-foreground transition-colors duration-200 disabled:cursor-not-allowed disabled:pointer-events-none end-0"
        type="button"
        onClick={toggleVisibility}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        aria-controls="password"
      >
        {isVisible ? (
          <EyeOff size={16} aria-hidden="true" />
        ) : (
          <Eye size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
