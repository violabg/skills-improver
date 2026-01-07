import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "narrow" | "wide";
}

export function PageShell({
  children,
  className,
  variant = "default",
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        "px-4 sm:px-6 py-8 md:py-12 w-full min-h-[calc(100vh-4rem)]",
        {
          "max-w-7xl mx-auto": variant === "wide",
          "max-w-5xl mx-auto": variant === "default",
          "max-w-2xl mx-auto": variant === "narrow",
        },
        className
      )}
      {...props}
    >
      <div className="slide-in-from-bottom-4 animate-in duration-700 fade-in">
        {children}
      </div>
    </div>
  );
}
