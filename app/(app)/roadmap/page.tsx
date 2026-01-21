import { RoadmapContent } from "@/components/roadmap";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { ArrowRight, Map, Play } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function RoadmapSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 pt-8 pb-16 max-w-5xl">
        <div className="bg-muted/30 mb-10 p-8 border border-border/50 rounded-3xl overflow-hidden text-center">
          <Skeleton className="mx-auto mb-4 w-48 h-8" />
          <Skeleton className="mx-auto mb-3 w-96 h-10" />
          <Skeleton className="mx-auto w-72 h-5" />
          <div className="mx-auto mt-6 max-w-md">
            <Skeleton className="mb-2 w-full h-4" />
            <Skeleton className="w-full h-3" />
          </div>
        </div>
        <div className="space-y-8">
          {[1, 2, 3].map((week) => (
            <div key={week}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="rounded-full w-10 h-10" />
                <div>
                  <Skeleton className="mb-1 w-24 h-5" />
                  <Skeleton className="w-32 h-4" />
                </div>
              </div>
              <div className="space-y-4 ml-5 pl-8 border-border border-l-2">
                <Skeleton className="rounded-xl w-full h-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function RoadmapContainer({ userId }: { userId: string }) {
  // Get active roadmap
  const roadmap = await db.roadmap.findFirst({
    where: {
      userId,
      completedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      milestones: {
        include: { progress: true },
        orderBy: { weekNumber: "asc" },
      },
      assessment: {
        select: { targetRole: true, currentRole: true },
      },
    },
  });

  if (!roadmap) {
    // Check if user has a completed assessment without a roadmap
    const completedAssessment = await db.assessment.findFirst({
      where: {
        userId,
        status: "COMPLETED",
        roadmap: null,
      },
      orderBy: { completedAt: "desc" },
      include: { gaps: true },
    });

    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="mb-8">
            <div className="flex justify-center items-center bg-primary/10 mx-auto mb-6 rounded-full w-20 h-20">
              <Map className="w-10 h-10 text-primary" />
            </div>
            <h1 className="mb-3 font-bold text-foreground text-3xl">
              No Active Roadmap
            </h1>
            <p className="text-muted-foreground text-lg">
              {completedAssessment
                ? "You have a completed assessment ready for a roadmap."
                : "Complete an assessment to generate your personalized learning roadmap."}
            </p>
          </div>

          {completedAssessment ? (
            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {completedAssessment.targetRole}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground text-sm">
                    Readiness Score:{" "}
                    <span className="font-semibold text-foreground">
                      {completedAssessment.gaps?.readinessScore ?? 0}%
                    </span>
                  </p>
                  <Link
                    href={`/assessment/${completedAssessment.id}/results`}
                    className={`${buttonVariants({ variant: "default" })} w-full`}
                  >
                    Generate Roadmap
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Link
              href="/assessment/start"
              className={`${buttonVariants({ variant: "default", size: "lg" })} w-full`}
            >
              <Play className="mr-2 w-5 h-5" />
              Start Assessment
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Transform dates to strings for client component
  const roadmapData = {
    ...roadmap,
    startedAt: roadmap.startedAt.toISOString(),
    completedAt: roadmap.completedAt?.toISOString() ?? null,
    milestones: roadmap.milestones.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      progress: m.progress.map((p) => ({
        ...p,
        selfReportedAt: p.selfReportedAt?.toISOString() ?? null,
        aiVerifiedAt: p.aiVerifiedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })),
  };

  return <RoadmapContent roadmap={roadmapData} />;
}

export default async function RoadmapPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/roadmap");
  }

  return (
    <Suspense fallback={<RoadmapSkeleton />}>
      <RoadmapContainer userId={session.user.id} />
    </Suspense>
  );
}
