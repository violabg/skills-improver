import { CareerGoalForm } from "@/components/assessment/career-goal-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { Suspense } from "react";

export default function GoalPage() {
  return (
    <PageShell
      currentStep={2}
      totalSteps={6}
      title="Choose Your Target Goal"
      description="What role or position are you working towards?"
      variant="narrow"
    >
      <Suspense fallback={<FormShellSkeleton />}>
        <CareerGoalForm />
      </Suspense>
    </PageShell>
  );
}
