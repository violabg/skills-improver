import { CareerGoalForm } from "@/components/assessment/career-goal-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FormSkeleton() {
  return (
    <div>
      <Card>
        <CardHeader>
          <Skeleton className="mb-2 w-48 h-6" />
          <Skeleton className="w-64 h-4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-full h-20" />
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Skeleton className="w-32 h-11" />
        <Skeleton className="flex-1 h-11" />
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

  return <CareerGoalForm />;
}

export default function CareerGoalPage() {
  return (
    <div className="bg-transparent min-h-screen">
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
        <Suspense fallback={<FormSkeleton />}>
          <CareerGoalContent />
        </Suspense>
      </div>
    </div>
  );
}
