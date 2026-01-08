import { ProcessingContent } from "@/components/assessment/processing-content";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function ProcessingSkeleton() {
  return (
    <PageShell
      variant="wide"
      className="flex justify-center items-center min-h-[50vh]"
    >
      <Skeleton className="w-64 h-12" />
    </PageShell>
  );
}

async function ProcessingPageContent({
  assessmentId,
}: {
  assessmentId: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/processing");
  }

  return (
    <PageShell
      variant="wide"
      className="flex justify-center items-center min-h-[50vh]"
    >
      <div className="space-y-8 w-full max-w-2xl">
        <div className="space-y-2">
          <div className="text-muted-foreground text-sm">Step 6 of 7</div>
          <h1 className="font-bold text-foreground text-3xl">
            Processing Your Assessment
          </h1>
          <p className="text-muted-foreground">
            AI is analyzing your responses. This usually takes a few moments.
          </p>
        </div>
        <ProcessingContent assessmentId={assessmentId} />
      </div>
    </PageShell>
  );
}

export default async function ProcessingPage({
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
    <Suspense fallback={<ProcessingSkeleton />}>
      <ProcessingPageContent assessmentId={assessmentId} />
    </Suspense>
  );
}
