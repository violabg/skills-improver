"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Play, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MilestoneCard } from "./milestone-card";

interface MilestoneProgress {
  id: string;
  verificationMethod: string;
  selfReportedAt: string | null;
  aiVerifiedAt: string | null;
  aiVerificationScore: number | null;
}

interface Milestone {
  id: string;
  skillId: string;
  weekNumber: number;
  title: string;
  description: string | null;
  resources: unknown;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  progress: MilestoneProgress[];
}

interface RoadmapData {
  id: string;
  title: string;
  totalWeeks: number;
  startedAt: string;
  completedAt: string | null;
  milestones: Milestone[];
  assessment: {
    targetRole: string | null;
    currentRole: string | null;
  };
}

interface RoadmapContentProps {
  roadmap: RoadmapData;
}

export function RoadmapContent({ roadmap }: RoadmapContentProps) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(roadmap.milestones);
  const [, startTransition] = useTransition();

  const completedCount = milestones.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const progressPercent = Math.round(
    (completedCount / milestones.length) * 100,
  );

  // Group milestones by week
  const milestonesByWeek = milestones.reduce(
    (acc, m) => {
      if (!acc[m.weekNumber]) {
        acc[m.weekNumber] = [];
      }
      acc[m.weekNumber].push(m);
      return acc;
    },
    {} as Record<number, Milestone[]>,
  );

  const weeks = Object.keys(milestonesByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  // Find current week (first week with incomplete milestones)
  const currentWeek =
    weeks.find((w) =>
      milestonesByWeek[w].some((m) => m.status !== "COMPLETED"),
    ) ?? weeks[weeks.length - 1];

  const handleMilestoneComplete = (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId ? { ...m, status: "COMPLETED" as const } : m,
      ),
    );
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 pt-8 pb-16 max-w-5xl">
        {/* Header */}
        <div className="relative bg-muted/30 mb-10 p-8 border border-border/50 rounded-3xl overflow-hidden text-center">
          <div className="top-0 right-0 absolute bg-primary/5 blur-3xl -mt-10 -mr-10 rounded-full w-64 h-64 pointer-events-none" />
          <div className="bottom-0 left-0 absolute bg-green-500/5 blur-3xl -mb-10 -ml-10 rounded-full w-64 h-64 pointer-events-none" />

          <div className="z-10 relative">
            <div className="inline-flex items-center gap-2 bg-primary/10 mb-4 px-4 py-1.5 rounded-full font-medium text-primary text-sm">
              <Target className="w-4 h-4" />
              {roadmap.assessment.targetRole}
            </div>

            <h1 className="mb-3 font-bold text-foreground text-3xl md:text-4xl tracking-tight">
              {roadmap.title}
            </h1>

            <p className="mx-auto max-w-xl text-muted-foreground">
              {roadmap.completedAt
                ? "Congratulations! You've completed your learning roadmap."
                : `Track your progress across ${roadmap.totalWeeks} weeks of focused learning.`}
            </p>

            {/* Progress bar */}
            <div className="mx-auto mt-6 max-w-md">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {milestones.length} milestones
                </span>
                <span className="font-semibold text-primary">
                  {progressPercent}%
                </span>
              </div>
              <div className="bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-green-500 rounded-full h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {weeks.map((weekNumber) => {
            const weekMilestones = milestonesByWeek[weekNumber];
            const isCurrentWeek = weekNumber === currentWeek;
            const isPastWeek =
              weekMilestones.every((m) => m.status === "COMPLETED") &&
              weekNumber < currentWeek;

            return (
              <div key={weekNumber} className="relative">
                {/* Week header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                      isPastWeek
                        ? "border-green-500 bg-green-500 text-white"
                        : isCurrentWeek
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPastWeek ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      weekNumber
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">
                      Week {weekNumber}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {weekMilestones.length} milestone
                      {weekMilestones.length > 1 ? "s" : ""}
                      {isCurrentWeek && " • Current Focus"}
                    </p>
                  </div>
                </div>

                {/* Milestones for this week */}
                <div className="space-y-4 ml-5 pl-8 border-border border-l-2">
                  {weekMilestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      isActive={
                        isCurrentWeek && milestone.status !== "COMPLETED"
                      }
                      onComplete={handleMilestoneComplete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion CTA */}
        {roadmap.completedAt && (
          <Card className="bg-green-500/5 mt-12 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                Roadmap Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground/80">
                You&apos;ve completed all milestones in your learning roadmap.
                Consider taking a new assessment to measure your progress!
              </p>
              <div className="flex gap-3">
                <Link
                  href="/assessment/start"
                  className={`${buttonVariants({ variant: "default" })}`}
                >
                  <Play className="mr-2 w-4 h-4" />
                  Start New Assessment
                </Link>
                <Link
                  href="/dashboard"
                  className={`${buttonVariants({ variant: "outline" })}`}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
