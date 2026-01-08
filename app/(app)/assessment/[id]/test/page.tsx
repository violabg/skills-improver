import { SkillTestForm } from "@/components/assessment/skill-test-form";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function TestSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-32 h-8" />
      <Skeleton className="h-100" />
    </div>
  );
}

export default function TestPage() {
  return (
    <PageShell
      currentStep={4}
      totalSteps={7}
      title="Skill Validation"
      description="Let's validate your strengths with a few questions. Take your time - this helps us give you better recommendations."
      variant="default"
    >
      <Suspense fallback={<TestSkeleton />}>
        <SkillTestForm />
      </Suspense>
    </PageShell>
  );
}
