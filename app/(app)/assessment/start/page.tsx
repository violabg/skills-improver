import { ProfileSetupForm } from "@/components/assessment/profile-setup-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="mb-2 w-48 h-6" />
        <Skeleton className="w-64 h-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Three select fields */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-full h-10" />
          </div>
        ))}

        {/* Radio group */}
        <div className="space-y-3">
          <Skeleton className="w-28 h-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-16" />
            ))}
          </div>
        </div>

        {/* Submit button */}
        <Skeleton className="w-full h-11" />
      </CardContent>
    </Card>
  );
}

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
        <Suspense fallback={<FormSkeleton />}>
          <AssessmentStartContent />
        </Suspense>
      </div>
    </div>
  );
}
