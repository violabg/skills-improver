import { SkillTestForm } from "@/components/assessment/skill-test-form";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function TestSkeleton() {
  return (
    <PageShell variant="default">
      <div className="space-y-6">
        <Skeleton className="w-32 h-8" />
        <Skeleton className="h-100" />
      </div>
    </PageShell>
  );
}

export default function TestPage() {
  return (
    <PageShell variant="default">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 4 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">Skill Validation</h1>
        <p className="text-muted-foreground">
          Let&apos;s validate your strengths with a few questions. Take your
          time - this helps us give you better recommendations.
        </p>
      </div>

      <Suspense fallback={<TestSkeleton />}>
        <SkillTestForm />
      </Suspense>
    </PageShell>
  );
}
