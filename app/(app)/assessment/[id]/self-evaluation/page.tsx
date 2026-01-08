import { SelfEvaluationForm } from "@/components/assessment/self-evaluation-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { Suspense } from "react";

export default function SelfEvaluationPage() {
  return (
    <PageShell
      currentStep={3}
      totalSteps={7}
      title="Rate Your Confidence"
      description="How confident are you in each of these skills? Be honest - there are no right or wrong answers."
      variant="narrow"
    >
      <Suspense fallback={<FormShellSkeleton />}>
        <SelfEvaluationForm />
      </Suspense>
    </PageShell>
  );
}
