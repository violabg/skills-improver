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
      <ProcessingContent assessmentId={assessmentId} />
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
