"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GapsData } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GapCard } from "./gap-card";

export function ResultsContent({ gapsData }: { gapsData: GapsData }) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ready";
    if (score >= 60) return "Nearly Ready";
    return "Building Skills";
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex justify-center items-center mb-4">
            <div
              className={`font-bold text-7xl ${getScoreColor(
                gapsData.readinessScore
              )}`}
            >
              {gapsData.readinessScore}%
            </div>
          </div>
          <h1 className="mb-2 font-bold text-foreground text-4xl">
            {getScoreLabel(gapsData.readinessScore)} for {gapsData.targetRole}
          </h1>
          <p className="text-muted-foreground text-lg">
            {"Here's your personalized skill gap analysis and growth roadmap"}
          </p>
        </div>

        {/* Strengths */}
        <section className="mb-12">
          <h2 className="mb-4 font-semibold text-foreground text-2xl">
            Your Strengths
          </h2>
          <div className="gap-4 grid md:grid-cols-3">
            {gapsData.strengths.map((strength) => (
              <Card
                key={strength}
                className="bg-green-500/5 p-4 border-green-500/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">{strength}</p>
                  </div>
                  <div className="text-green-600 dark:text-green-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Skill Gaps */}
        <section className="mb-12">
          <h2 className="mb-4 font-semibold text-foreground text-2xl">
            Priority Skill Gaps
          </h2>
          <p className="mb-6 text-muted-foreground">
            Focus on these areas to accelerate your career progression
          </p>

          <div className="space-y-4">
            {gapsData.gaps.map((gap) => (
              <GapCard
                key={gap.skillId}
                assessmentGapId={gapsData.assessmentGapsId}
                skillId={gap.skillId}
                skillName={gap.skillName}
                currentLevel={gap.currentLevel}
                targetLevel={gap.targetLevel}
                gapSize={gap.gapSize}
                impact={gap.impact}
                explanation={gap.explanation}
                recommendedActions={gap.recommendedActions}
                estimatedTimeWeeks={gap.estimatedTimeWeeks}
                priority={gap.priority}
                evidence={gap.evidence}
                resources={gap.resources}
              />
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex sm:flex-row flex-col justify-center items-center gap-4">
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
          <Link
            href="/chat"
            className={`${buttonVariants({ variant: "outline", size: "lg" })}`}
          >
            Talk to Career Advisor
          </Link>
        </div>
      </div>
    </div>
  );
}
