"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GapItem {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impact: string;
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
  resources?: Array<{
    id: string;
    provider: string;
    url: string;
    title?: string | null;
    cost?: string | null;
    estimatedTime?: number | null;
  }>;
  evidence?: Array<{
    id: string;
    provider?: string | null;
    referenceUrl?: string | null;
    signals?: unknown;
    createdAt?: string;
  }>;
}

interface GapsData {
  assessmentId: string;
  targetRole?: string | null;
  readinessScore: number;
  gaps: GapItem[];
  strengths: string[];
  overallRecommendation: string;
}

export function ResultsContent({ gapsData }: { gapsData: GapsData }) {
  const router = useRouter();
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

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

  const getImpactColor = (impact: string) => {
    const k = (impact || "").toLowerCase();
    switch (k) {
      case "critical":
      case "high":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "low":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    }
    return "";
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
              <Card key={gap.skillId} className="bg-card overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedGap(
                      expandedGap === gap.skillName ? null : gap.skillName
                    )
                  }
                  className="hover:bg-muted/50 p-6 w-full text-left transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground text-lg">
                          {gap.skillName}
                        </h3>
                        <Badge
                          className={getImpactColor(
                            (gap.impact || "").toLowerCase()
                          )}
                        >
                          {gap.impact} impact
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Current: <strong>{gap.currentLevel}/5</strong>
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-muted-foreground">
                          Target: <strong>{gap.targetLevel}/5</strong>
                        </span>
                      </div>

                      <p className="text-muted-foreground text-sm">
                        {gap.explanation}
                      </p>
                    </div>

                    <svg
                      className={`text-muted-foreground h-5 w-5 shrink-0 transition-transform ${
                        expandedGap === gap.skillName ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {expandedGap === gap.skillName && (
                  <div className="bg-muted/30 p-6 border-border border-t">
                    <h4 className="mb-3 font-medium text-foreground">
                      Recommended Resources
                    </h4>
                    <div className="space-y-2">
                      {gap.resources && gap.resources.length > 0
                        ? gap.resources.map((r) => (
                            <a
                              key={r.id}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                            >
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {r.title || r.provider}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {r.provider} • {r.cost || "free/paid"} •{" "}
                                  {r.estimatedTime || "—"} hrs
                                </p>
                              </div>
                              <div className="text-primary">Open</div>
                            </a>
                          ))
                        : gap.recommendedActions.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                            >
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {action}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Estimated: {gap.estimatedTimeWeeks} weeks
                                </p>
                              </div>
                            </div>
                          ))}

                      {gap.evidence && gap.evidence.length > 0 && (
                        <div className="mt-4">
                          <h5 className="mb-2 font-medium text-foreground">
                            Relevant Evidence
                          </h5>
                          <div className="space-y-2">
                            {gap.evidence.map((ev) => (
                              <a
                                key={ev.id}
                                href={ev.referenceUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-foreground text-sm">
                                    {ev.provider || "Evidence"}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {(ev.signals &&
                                    typeof ev.signals === "object" &&
                                    "summary" in ev.signals
                                      ? (ev.signals as { summary: string })
                                          .summary
                                      : null) || ev.referenceUrl}
                                  </p>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  View
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
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
