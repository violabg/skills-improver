import { SelfEvaluationForm } from "@/components/assessment/self-evaluation-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function FormSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-screen animate-pulse" />
      </div>
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

        <SelfEvaluationForm />
      </div>
    </div>
  );
}

export default function SelfEvaluationPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SelfEvaluationContent />
    </Suspense>
  );
}
