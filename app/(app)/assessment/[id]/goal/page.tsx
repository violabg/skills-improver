import { CareerGoalForm } from "@/components/assessment/career-goal-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { Suspense } from "react";

export default function GoalPage() {
  return (
    <PageShell variant="narrow">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 2 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Choose Your Target Goal
        </h1>
        <p className="text-muted-foreground">
          What role or position are you working towards?
        </p>
      </div>
      <Suspense fallback={<FormShellSkeleton />}>
        <CareerGoalForm />
      </Suspense>
    </PageShell>
  );
}
