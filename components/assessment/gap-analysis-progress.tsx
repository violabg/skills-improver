"use client";

import { Card } from "@/components/ui/card";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { client } from "@/lib/orpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SkillStatus {
  skillId: string;
  skillName: string;
  status: "pending" | "analyzing" | "complete";
  result?: {
    gapSize: number;
    impact: string;
  };
}

interface SkillToAnalyze {
  skillId: string;
  skillName: string;
  currentLevel: number;
  category: "HARD" | "SOFT" | "META";
}

interface GapAnalysisProgressProps {
  skillsToAnalyze: SkillToAnalyze[];
  targetRole: string;
}

export function GapAnalysisProgress({
  skillsToAnalyze,
  targetRole,
}: GapAnalysisProgressProps) {
  const assessment = useAssessment();
  const router = useRouter();
  const [skillStatuses, setSkillStatuses] = useState<SkillStatus[]>(
    skillsToAnalyze.map((s) => ({
      skillId: s.skillId,
      skillName: s.skillName,
      status: "pending",
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Use refs to avoid dependency issues
  const gapsRef = useRef<unknown[]>([]);
  const strengthsRef = useRef<string[]>([]);
  const isRunningRef = useRef(false);

  const progress = (currentIndex / skillsToAnalyze.length) * 100;

  // Start the analysis chain on mount
  useEffect(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const runAnalysis = async () => {
      for (let i = 0; i < skillsToAnalyze.length; i++) {
        const skill = skillsToAnalyze[i];

        // Update status to analyzing
        setSkillStatuses((prev) =>
          prev.map((s) =>
            s.skillId === skill.skillId ? { ...s, status: "analyzing" } : s
          )
        );

        try {
          const result = await client.gaps.analyzeSkill({
            assessmentId: assessment.id,
            skillId: skill.skillId,
            skillName: skill.skillName,
            currentLevel: skill.currentLevel,
            category: skill.category,
            targetRole,
          });

          // Update status to complete
          setSkillStatuses((prev) =>
            prev.map((s) =>
              s.skillId === skill.skillId
                ? {
                    ...s,
                    status: "complete",
                    result: { gapSize: result.gapSize, impact: result.impact },
                  }
                : s
            )
          );

          // Track gaps/strengths in refs
          if (result.gapSize > 0) {
            gapsRef.current.push(result);
          } else {
            strengthsRef.current.push(skill.skillName);
          }

          setCurrentIndex(i + 1);
        } catch (err) {
          console.error(`Failed to analyze ${skill.skillName}:`, err);
          // Mark as complete with fallback
          setSkillStatuses((prev) =>
            prev.map((s) =>
              s.skillId === skill.skillId
                ? {
                    ...s,
                    status: "complete",
                    result: { gapSize: 0, impact: "MEDIUM" },
                  }
                : s
            )
          );
          strengthsRef.current.push(skill.skillName);
          setCurrentIndex(i + 1);
        }
      }

      // All done - save results
      const gaps = gapsRef.current;
      const strengths = strengthsRef.current;

      const readinessScore = Math.round(
        (strengths.length / skillsToAnalyze.length) * 100
      );
      const topGaps = (gaps as Array<{ skillName: string }>)
        .slice(0, 3)
        .map((g) => g.skillName);
      const overallRecommendation =
        gaps.length === 0
          ? `You are well-prepared for ${targetRole}!`
          : `Focus on ${topGaps.join(
              ", "
            )} to accelerate your transition to ${targetRole}.`;

      try {
        await client.gaps.save({
          assessmentId: assessment.id,
          gaps: gaps as unknown[],
          strengths,
          readinessScore,
          overallRecommendation,
        });
        setIsComplete(true);
        router.refresh();
      } catch (err) {
        console.error("Failed to save gaps:", err);
        setError("Failed to save analysis results");
      }
    };

    runAnalysis();
  }, [skillsToAnalyze, assessment.id, targetRole, router]);

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center items-center bg-green-500/10 mx-auto rounded-full w-16 h-16">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-foreground">Analysis complete! Loading results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mx-auto max-w-2xl">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center items-center mx-auto w-16 h-16">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="absolute inset-2 flex justify-center items-center bg-primary rounded-full">
              <svg
                className="w-8 h-8 text-primary-foreground animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="font-bold text-foreground text-2xl">
          Analyzing Your Skills
        </h2>
        <p className="text-muted-foreground">
          AI is evaluating each skill for {targetRole}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            {currentIndex} of {skillsToAnalyze.length} skills analyzed
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="bg-muted rounded-full w-full h-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Skills list */}
      <Card className="bg-card p-6 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {skillStatuses.map((skill) => (
            <div
              key={skill.skillId}
              className={`flex items-center justify-between rounded-lg px-4 py-3 transition-colors ${
                skill.status === "analyzing"
                  ? "bg-primary/10 border border-primary/30"
                  : skill.status === "complete"
                  ? "bg-muted/50"
                  : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {skill.status === "pending" && (
                  <div className="border-2 border-muted-foreground/30 rounded-full w-5 h-5" />
                )}
                {skill.status === "analyzing" && (
                  <div className="border-2 border-primary border-t-transparent rounded-full w-5 h-5 animate-spin" />
                )}
                {skill.status === "complete" && (
                  <div className="flex justify-center items-center bg-green-500 rounded-full w-5 h-5">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <span
                  className={`font-medium ${
                    skill.status === "analyzing"
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {skill.skillName}
                </span>
              </div>
              {skill.status === "complete" && skill.result && (
                <span
                  className={`text-sm font-medium ${
                    skill.result.gapSize === 0
                      ? "text-green-600"
                      : skill.result.impact === "CRITICAL"
                      ? "text-red-600"
                      : skill.result.impact === "HIGH"
                      ? "text-orange-600"
                      : "text-yellow-600"
                  }`}
                >
                  {skill.result.gapSize === 0
                    ? "✓ Strong"
                    : `Gap: ${skill.result.gapSize}`}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom message */}
      <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground text-sm text-center">
        <p>
          We&apos;re using AI to compare your skills with industry standards and
          identify the most impactful areas for growth.
        </p>
      </div>
    </div>
  );
}
