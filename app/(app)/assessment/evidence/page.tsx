import { EvidenceUploadForm } from "@/components/assessment/evidence-upload-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function EvidenceSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-screen animate-pulse" />
      </div>
    </div>
  );
}

async function EvidenceContent({ assessmentId }: { assessmentId: string }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/evidence");
  }

  return (
    <div className="bg-transparent min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 5 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Add Evidence (Optional)
          </h1>
          <p className="text-muted-foreground">
            Connect your GitHub or upload your portfolio to help us understand
            your experience better. This step is completely optional.
          </p>
        </div>

        <EvidenceUploadForm assessmentId={assessmentId} />
      </div>
    </div>
  );
}

export default async function EvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  const params = await searchParams;
  const assessmentId = params.assessmentId;

  if (!assessmentId) {
    return redirect("/assessment/start");
  }

  return (
    <Suspense fallback={<EvidenceSkeleton />}>
      <EvidenceContent assessmentId={assessmentId} />
    </Suspense>
  );
}
