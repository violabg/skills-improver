"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      const errorMessage =
        this.state.error.message || "An unexpected error occurred";

      return (
        <div className="flex justify-center items-center p-4 min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-destructive/10 rounded-full size-10">
                  <AlertCircle className="size-5 text-destructive" />
                </div>
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
            </CardContent>
            <CardFooter className="flex sm:flex-row flex-col gap-2">
              <Button onClick={this.reset} className="w-full sm:w-auto">
                Try Again
              </Button>
              <Button
                variant="outline"
                render={(props) => (
                  <Link {...props} href="/dashboard">
                    Go to Dashboard
                  </Link>
                )}
                className="w-full sm:w-auto"
              />
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
