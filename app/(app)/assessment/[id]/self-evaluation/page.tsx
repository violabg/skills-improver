import { SelfEvaluationForm } from "@/components/assessment/self-evaluation-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { Suspense } from "react";

export default function SelfEvaluationPage() {
  return (
    <PageShell variant="narrow">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 3 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Rate Your Confidence
        </h1>
        <p className="text-muted-foreground">
          How confident are you in each of these skills? Be honest - there are
          no right or wrong answers.
        </p>
      </div>
      <Suspense fallback={<FormShellSkeleton />}>
        <SelfEvaluationForm />
      </Suspense>
    </PageShell>
  );
}
