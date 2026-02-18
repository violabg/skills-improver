import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { buttonVariants } from "./button";
import { Button } from "./button";

interface LoadingButtonProps
  extends
    React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
