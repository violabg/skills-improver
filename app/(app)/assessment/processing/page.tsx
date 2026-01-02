import { ProcessingContent } from "@/components/assessment/processing-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function ProcessingSkeleton() {
  return (
    <div className="flex justify-center items-center bg-background min-h-screen">
      <div className="bg-muted rounded w-64 h-12 animate-pulse" />
    </div>
  );
}

async function ProcessingPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/processing");
  }

  return <ProcessingContent />;
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<ProcessingSkeleton />}>
      <ProcessingPageContent />
    </Suspense>
  );
}
