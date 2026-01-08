import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { AssessmentProvider } from "@/lib/hooks/use-assessment";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function AssessmentLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?redirect=/assessment/${id}`);
  }

  // Verify assessment belongs to user
  const assessment = await db.assessment.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!assessment) {
    redirect("/assessment/start");
  }

  return (
    <AssessmentProvider assessment={assessment}>{children}</AssessmentProvider>
  );
}
