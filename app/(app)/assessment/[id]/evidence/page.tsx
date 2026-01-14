import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EvidenceUploadForm } from "@/components/assessment/evidence-upload-form";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

async function EvidenceContent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?redirect=/assessment");
  }

  // Fetch user's CV settings
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { cvUrl: true, useCvForAnalysis: true },
  });

  return (
    <EvidenceUploadForm
      initialCvUrl={user?.cvUrl ?? null}
      initialUseCvForAnalysis={user?.useCvForAnalysis ?? false}
    />
  );
}

import { Card } from "@/components/ui/card";

function EvidenceFormSkeleton() {
  return (
    <div className="space-y-8 mx-auto max-w-4xl">
      <div className="gap-6 grid md:grid-cols-2">
        <Card className="h-full">
          <div className="flex flex-col p-6 h-full">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton className="rounded-xl w-12 h-12" />
              <div>
                <Skeleton className="mb-2 w-32 h-6" />
                <Skeleton className="w-48 h-4" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Skeleton className="w-full h-10" />
            </div>
          </div>
        </Card>
        <Card className="h-full">
          <div className="flex flex-col space-y-4 p-6 h-full">
            <div className="space-y-2">
              <Skeleton className="w-32 h-5" />
              <Skeleton className="w-full h-32" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-48 h-4" />
                </div>
                <Skeleton className="w-10 h-6" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="rounded-lg w-8 h-8" />
          <div className="space-y-1">
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-64 h-4" />
          </div>
        </div>
        <div className="gap-8 grid md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="w-32 h-5" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="rounded-lg w-full h-24" />
            <Skeleton className="rounded-lg w-full h-10" />
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Skeleton className="w-20 h-10" />
        <div className="flex gap-4">
          <Skeleton className="w-24 h-10" />
          <Skeleton className="rounded-full w-48 h-12" />
        </div>
      </div>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <PageShell
      currentStep={5}
      totalSteps={6}
      title="Add Evidence (Optional)"
      description="Connect your GitHub or upload your portfolio to help us understand your experience better. This step is completely optional."
      variant="default"
    >
      <Suspense fallback={<EvidenceFormSkeleton />}>
        <EvidenceContent />
      </Suspense>
    </PageShell>
  );
}
