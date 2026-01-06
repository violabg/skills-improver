import { ProfileSetupForm } from "@/components/assessment/profile-setup-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function FormSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-2xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-64 animate-pulse" />
      </div>
    </div>
  );
}

async function AssessmentStartContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/start");
  }

  return (
    <div className="bg-transparent min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-2xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 1 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Quick Profile Setup
          </h1>
          <p className="text-muted-foreground">
            Help us understand your current position and career goals
          </p>
        </div>

        <ProfileSetupForm />
      </div>
    </div>
  );
}

export default function AssessmentStartPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <AssessmentStartContent />
    </Suspense>
  );
}
