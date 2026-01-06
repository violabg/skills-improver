import { SelfEvaluationForm } from "@/components/assessment/self-evaluation-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FormSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((group) => (
        <div key={group} className="space-y-4">
          <Skeleton className="w-48 h-7" />
          <div className="space-y-6">
            {[1, 2, 3].map((card) => (
              <Card key={card} className="p-6">
                <Skeleton className="mb-4 w-32 h-4" />
                <div className="gap-2 grid grid-cols-5">
                  {[1, 2, 3, 4, 5].map((btn) => (
                    <Skeleton key={btn} className="w-full h-16" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

async function SelfEvaluationContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/self-evaluation");
  }

  return <SelfEvaluationForm />;
}

export default function SelfEvaluationPage() {
  return (
    <div className="bg-transparent min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 3 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Rate Your Confidence
          </h1>
          <p className="text-muted-foreground">
            How confident are you in each of these skills? Be honest - there are
            no right or wrong answers.
          </p>
        </div>
        <Suspense fallback={<FormSkeleton />}>
          <SelfEvaluationContent />
        </Suspense>
      </div>
    </div>
  );
}
