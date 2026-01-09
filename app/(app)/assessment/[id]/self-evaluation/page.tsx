import { SelfEvaluationForm } from "@/components/assessment/self-evaluation-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { serverClient } from "@/lib/orpc/orpc.server";
import { Suspense } from "react";

interface SelfEvaluationPageProps {
  params: Promise<{ id: string }>;
}

// Server component that fetches skills
async function SelfEvaluationFormLoader({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const result = await serverClient.skills.generateForProfile({
    assessmentId: assessmentId,
  });
  console.log("result");
  return (
    <SelfEvaluationForm skills={result.skills} reasoning={result.reasoning} />
  );
}

export default async function SelfEvaluationPage({
  params,
}: SelfEvaluationPageProps) {
  const { id } = await params;

  return (
    <PageShell
      currentStep={3}
      totalSteps={6}
      title="Rate Your Confidence"
      description="How confident are you in each of these skills? Be honest - there are no right or wrong answers."
      variant="narrow"
    >
      <Suspense fallback={<FormShellSkeleton />}>
        <SelfEvaluationFormLoader assessmentId={id} />
      </Suspense>
    </PageShell>
  );
}
