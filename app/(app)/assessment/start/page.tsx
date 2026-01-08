import { ProfileSetupForm } from "@/components/assessment/profile-setup-form";
import { FormShellSkeleton } from "@/components/skeletons";
import { PageShell } from "@/components/ui/page-shell";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AssessmentStartContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/start");
  }

  return <ProfileSetupForm />;
}

export default function AssessmentStartPage() {
  return (
    <PageShell variant="narrow">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 1 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Quick Profile Setup
        </h1>
        <p className="text-muted-foreground">
          Help us understand your current position and career goals
        </p>
      </div>
      <Suspense fallback={<FormShellSkeleton />}>
        <AssessmentStartContent />
      </Suspense>
    </PageShell>
  );
}
