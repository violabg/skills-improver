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

function EvidenceFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-32" />
      <Skeleton className="w-full h-40" />
      <Skeleton className="w-full h-48" />
      <Skeleton className="w-full h-24" />
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="w-20 h-10" />
        <div className="flex gap-3">
          <Skeleton className="w-28 h-10" />
          <Skeleton className="w-24 h-10" />
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
