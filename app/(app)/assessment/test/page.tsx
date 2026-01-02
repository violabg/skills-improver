import { SkillTestForm } from "@/components/assessment/skill-test-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function TestSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-screen animate-pulse" />
      </div>
    </div>
  );
}

async function TestContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/test");
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 4 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Skill Validation
          </h1>
          <p className="text-muted-foreground">
            Let's validate your strengths with a few questions. Take your time -
            this helps us give you better recommendations.
          </p>
        </div>

        <SkillTestForm />
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<TestSkeleton />}>
      <TestContent />
    </Suspense>
  );
}
