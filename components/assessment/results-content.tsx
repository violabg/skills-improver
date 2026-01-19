"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="mx-auto px-4 pt-8 pb-16 max-w-7xl">
        {/* Hero Header */}
        <div className="relative bg-muted/30 mb-12 p-12 border border-border/50 rounded-3xl overflow-hidden text-center">
          <div className="top-0 right-0 absolute bg-primary/5 blur-3xl -mt-10 -mr-10 rounded-full w-64 h-64 pointer-events-none" />
          <div className="bottom-0 left-0 absolute bg-green-500/5 blur-3xl -mb-10 -ml-10 rounded-full w-64 h-64 pointer-events-none" />

          <div className="z-10 relative">
            <div className="inline-flex relative justify-center items-center mb-6">
              <svg
                className="absolute opacity-20 w-[160%] h-[160%] animate-spin-slow"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className={getScoreColor(gapsData.readinessScore)}
                />
              </svg>
              <div
                className={`text-8xl md:text-9xl font-black tracking-tighter ${getScoreColor(
                  gapsData.readinessScore,
                )}`}
              >
                {gapsData.readinessScore}
                <span className="opacity-60 text-4xl align-top">%</span>
              </div>
            </div>
            <h1 className="bg-clip-text bg-gradient-to-r from-primary to-blue-600 mb-2 pb-1 font-bold text-transparent text-3xl md:text-5xl tracking-tight">
              {getScoreLabel(gapsData.readinessScore)} for{" "}
              <span>{gapsData.targetRole}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed">
              We&apos;ve analyzed your skills against industry standards. Here
              is your personalized roadmap to close the gap.
            </p>
          </div>
        </div>

        <div className="gap-10 grid grid-cols-1 lg:grid-cols-12">
          {/* Sidebar / Strengths */}
          <div className="space-y-8 order-2 lg:order-1 lg:col-span-4">
            <section className="top-8 sticky bg-card shadow-sm p-6 border border-border/50 rounded-2xl">
              <h2 className="flex items-center gap-2 mb-6 font-bold text-foreground text-xl">
                <span className="text-green-500">🌟</span> Your Strengths
              </h2>
              <div className="space-y-3">
                {gapsData.strengths.map((strength) => (
                  <div
                    key={strength}
                    className="flex items-start gap-3 bg-green-500/5 p-4 border border-green-500/20 rounded-xl text-sm"
                  >
                    <div className="mt-0.5 text-green-600 dark:text-green-400">
                      ✓
                    </div>
                    <p className="font-medium text-foreground leading-relaxed">
                      {strength}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="hidden lg:block">
              <Card className="relative bg-primary/5 border-primary/10 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-primary">
                    Ready to level up?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-foreground/80 text-sm">
                    Generate a personalized learning roadmap based on your gaps.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/assessment/${gapsData.assessmentId}/roadmap`}
                      className={`${buttonVariants({ variant: "default", size: "lg" })} shadow-lg shadow-primary/20 w-full`}
                    >
                      Generate Roadmap
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                    <Link
                      href="/chat"
                      className={`${buttonVariants({ variant: "ghost" })} w-full`}
                    >
                      Chat with AI Advisor
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content / Gaps */}
          <div className="space-y-8 order-1 lg:order-2 lg:col-span-8">
            <section>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="font-bold text-foreground text-2xl">
                    Priority Skill Gaps
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    Focus on these high-impact areas first
                  </p>
                </div>
              </div>

              <div className="space-y-6">
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
          </div>

          <div className="lg:hidden space-y-4 order-3 col-span-1">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Link
              href="/chat"
              className={`${buttonVariants({ variant: "outline", size: "lg" })} block w-full`}
            >
              Talk to Career Advisor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
