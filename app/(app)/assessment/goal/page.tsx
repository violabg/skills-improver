import { CareerGoalForm } from "@/components/assessment/career-goal-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function CareerGoalContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/goal");
  }

  return <CareerGoalForm />;
}

export default function CareerGoalPage() {
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
        <CareerGoalContent />
      </Suspense>
    </PageShell>
  );
}
