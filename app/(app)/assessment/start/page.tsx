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
    <PageShell
      currentStep={1}
      totalSteps={6}
      title="Quick Profile Setup"
      description="Help us understand your current position and career goals"
      variant="narrow"
    >
      <Suspense fallback={<FormShellSkeleton />}>
        <AssessmentStartContent />
      </Suspense>
    </PageShell>
  );
}
