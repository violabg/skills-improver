import { CareerGoalForm } from "@/components/assessment/career-goal-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function FormSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-2xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-96 animate-pulse" />
      </div>
    </div>
  );
}

async function CareerGoalContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/goal");
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 2 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Choose Your Target Goal
          </h1>
          <p className="text-muted-foreground">
            What role or position are you working towards?
          </p>
        </div>

        <CareerGoalForm />
      </div>
    </div>
  );
}

export default function CareerGoalPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <CareerGoalContent />
    </Suspense>
  );
}
