"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Mock data - in production this would come from oRPC
interface SkillGap {
  skill: string;
  category: "hard" | "soft" | "meta";
  currentLevel: number;
  targetLevel: number;
  impact: "high" | "medium" | "low";
  reasoning: string;
  resources: Array<{ title: string; url: string; type: string }>;
}

const MOCK_RESULTS = {
  readinessScore: 72,
  careerGoal: "Senior Frontend Developer",
  strengths: [
    { skill: "React & Component Architecture", level: 5 },
    { skill: "TypeScript", level: 4 },
    { skill: "Problem Solving", level: 4 },
  ],
  gaps: [
    {
      skill: "System Architecture",
      category: "hard",
      currentLevel: 2,
      targetLevel: 4,
      impact: "high",
      reasoning:
        "Senior developers need to design scalable systems. Your self-assessment and responses suggest you're still building this skill.",
      resources: [
        {
          title: "Designing Data-Intensive Applications",
          url: "#",
          type: "Book",
        },
        { title: "System Design Primer", url: "#", type: "Course" },
      ],
    },
    {
      skill: "Mentoring Others",
      category: "soft",
      currentLevel: 2,
      targetLevel: 4,
      impact: "high",
      reasoning:
        "Senior roles require guiding junior developers. This is a key differentiator for advancement.",
      resources: [
        { title: "The Manager's Path", url: "#", type: "Book" },
        { title: "Mentorship Best Practices", url: "#", type: "Article" },
      ],
    },
    {
      skill: "Testing & Quality Assurance",
      category: "hard",
      currentLevel: 3,
      targetLevel: 4,
      impact: "medium",
      reasoning:
        "Strong testing practices are expected at senior level. Your responses showed good understanding but could be deeper.",
      resources: [
        { title: "Testing JavaScript Applications", url: "#", type: "Course" },
        { title: "Test-Driven Development", url: "#", type: "Book" },
      ],
    },
  ] as SkillGap[],
};

export function ResultsContent() {
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
    switch (impact) {
      case "high":
        return "bg-red-500/20 text-red-700 dark:text-red-300";
      case "medium":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "low":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex justify-center items-center mb-4">
            <div
              className={`font-bold text-7xl ${getScoreColor(
                MOCK_RESULTS.readinessScore
              )}`}
            >
              {MOCK_RESULTS.readinessScore}%
            </div>
          </div>
          <h1 className="mb-2 font-bold text-foreground text-4xl">
            {getScoreLabel(MOCK_RESULTS.readinessScore)} for{" "}
            {MOCK_RESULTS.careerGoal}
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your personalized skill gap analysis and growth roadmap
          </p>
        </div>

        {/* Strengths */}
        <section className="mb-12">
          <h2 className="mb-4 font-semibold text-foreground text-2xl">
            Your Strengths
          </h2>
          <div className="gap-4 grid md:grid-cols-3">
            {MOCK_RESULTS.strengths.map((strength) => (
              <Card
                key={strength.skill}
                className="bg-green-500/5 p-4 border-green-500/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-foreground">
                      {strength.skill}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Level {strength.level}/5
                    </p>
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
            {MOCK_RESULTS.gaps.map((gap) => (
              <Card key={gap.skill} className="bg-card overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedGap(expandedGap === gap.skill ? null : gap.skill)
                  }
                  className="hover:bg-muted/50 p-6 w-full text-left transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground text-lg">
                          {gap.skill}
                        </h3>
                        <Badge className={getImpactColor(gap.impact)}>
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
                        {gap.reasoning}
                      </p>
                    </div>

                    <svg
                      className={`text-muted-foreground h-5 w-5 flex-shrink-0 transition-transform ${
                        expandedGap === gap.skill ? "rotate-180" : ""
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

                {expandedGap === gap.skill && (
                  <div className="bg-muted/30 p-6 border-border border-t">
                    <h4 className="mb-3 font-medium text-foreground">
                      Recommended Resources
                    </h4>
                    <div className="space-y-2">
                      {gap.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {resource.title}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {resource.type}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ))}
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
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/chat")}
          >
            Talk to Career Advisor
          </Button>
        </div>
      </div>
    </div>
  );
}
