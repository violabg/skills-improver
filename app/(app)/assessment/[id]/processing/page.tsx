"use client";

import { ProcessingContent } from "@/components/assessment/processing-content";
import { PageShell } from "@/components/ui/page-shell";

export default function ProcessingPage() {
  return (
    <PageShell
      variant="wide"
      className="flex justify-center items-center min-h-[50vh]"
    >
      <div className="space-y-8 w-full max-w-2xl">
        <div className="space-y-2">
          <div className="text-muted-foreground text-sm">Step 6 of 7</div>
          <h1 className="font-bold text-foreground text-3xl">
            Processing Your Assessment
          </h1>
          <p className="text-muted-foreground">
            AI is analyzing your responses. This usually takes a few moments.
          </p>
        </div>
        <ProcessingContent />
      </div>
    </PageShell>
  );
}
