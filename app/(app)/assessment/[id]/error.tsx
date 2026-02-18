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
import { useEffect } from "react";

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Assessment error:", error);
  }, [error]);

  return (
    <div className="flex justify-center items-center p-4 min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex justify-center items-center bg-destructive/10 rounded-full size-10">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <CardTitle>Assessment Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error.message || "Unable to load this assessment"}
          </p>
          {error.digest && (
            <p className="mt-2 text-muted-foreground/70 text-xs">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex sm:flex-row flex-col gap-2">
          <Button onClick={reset} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Button
            variant="outline"
            render={(props) => (
              <Link {...props} href="/assessment/start">
                Start New Assessment
              </Link>
            )}
            className="w-full sm:w-auto"
          />
        </CardFooter>
      </Card>
    </div>
  );
}
