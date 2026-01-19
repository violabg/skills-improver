"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc/client";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  BookOpen01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  PlayIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";

interface Resource {
  type: string;
  title: string;
  url?: string;
  estimatedHours?: number;
}

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

interface MilestoneCardProps {
  milestone: Milestone;
  isActive: boolean;
  onComplete: (milestoneId: string) => void;
}

export function MilestoneCard({
  milestone,
  isActive,
  onComplete,
}: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationState, setVerificationState] = useState<
    "idle" | "loading" | "question" | "result"
  >("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean;
    score: number;
    feedback: string;
    newLevel: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const resources = (milestone.resources as Resource[]) ?? [];
  const isCompleted = milestone.status === "COMPLETED";

  const handleSelfReport = async () => {
    startTransition(async () => {
      try {
        await client.roadmap.completeMilestone({
          milestoneId: milestone.id,
          method: "SELF_REPORTED",
        });
        onComplete(milestone.id);
      } catch (error) {
        console.error("Failed to complete milestone:", error);
      }
    });
  };

  const handleStartVerification = async () => {
    setVerificationState("loading");
    setShowVerifyDialog(true);

    try {
      const result = await client.roadmap.startVerification({
        milestoneId: milestone.id,
      });
      setQuestion(result.question);
      setVerificationState("question");
    } catch (error) {
      console.error("Failed to start verification:", error);
      setVerificationState("idle");
      setShowVerifyDialog(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    setVerificationState("loading");

    try {
      const result = await client.roadmap.submitVerificationAnswer({
        milestoneId: milestone.id,
        question,
        answer,
      });

      setVerificationResult({
        passed: result.passed,
        score: result.score,
        feedback: result.feedback,
        newLevel: result.newLevel,
      });
      setVerificationState("result");

      if (result.passed) {
        onComplete(milestone.id);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      setVerificationState("question");
    }
  };

  const closeDialog = () => {
    setShowVerifyDialog(false);
    setVerificationState("idle");
    setQuestion("");
    setAnswer("");
    setVerificationResult(null);
  };

  return (
    <>
      <Card
        className={`transition-all duration-200 ${
          isCompleted
            ? "border-green-500/30 bg-green-500/5"
            : isActive
              ? "border-primary/50 bg-card shadow-md"
              : "border-border/50 bg-muted/30 opacity-60"
        }`}
      >
        <CardHeader
          className="pb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    className="w-4 h-4"
                  />
                ) : (
                  <HugeiconsIcon icon={BookOpen01Icon} className="w-3 h-3" />
                )}
              </div>
              <div>
                <CardTitle className="font-semibold text-base">
                  {milestone.title}
                </CardTitle>
                {milestone.description && (
                  <p className="mt-1 text-muted-foreground text-sm line-clamp-2">
                    {milestone.description}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-0 w-8 h-8">
              {isExpanded ? (
                <HugeiconsIcon icon={ArrowUp01Icon} className="w-4 h-4" />
              ) : (
                <HugeiconsIcon icon={ArrowDown01Icon} className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-2">
            {/* Resources */}
            {resources.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-foreground text-sm">
                  Learning Resources
                </h4>
                <div className="space-y-2">
                  {resources.map((resource, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg text-sm"
                    >
                      <span className="bg-primary/10 px-1.5 py-0.5 rounded font-medium text-primary text-xs">
                        {resource.type}
                      </span>
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-foreground hover:text-primary hover:underline"
                        >
                          {resource.title}
                        </a>
                      ) : (
                        <span className="flex-1 text-foreground">
                          {resource.title}
                        </span>
                      )}
                      {resource.estimatedHours && (
                        <span className="text-muted-foreground text-xs">
                          ~{resource.estimatedHours}h
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isCompleted && isActive && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelfReport}
                  disabled={isPending}
                >
                  {isPending ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 w-4 h-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="mr-2 w-4 h-4"
                    />
                  )}
                  Mark Complete
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartVerification}
                  disabled={isPending || verificationState === "loading"}
                >
                  {verificationState === "loading" ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 w-4 h-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      className="mr-2 w-4 h-4"
                    />
                  )}
                  Verify with AI
                </Button>
              </div>
            )}

            {/* Completion info */}
            {isCompleted && milestone.progress.length > 0 && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <HugeiconsIcon
                  icon={CheckmarkCircle01Icon}
                  className="w-4 h-4"
                />
                Completed via{" "}
                {milestone.progress[0].verificationMethod === "AI_VERIFIED"
                  ? "AI verification"
                  : "self-report"}
                {milestone.progress[0].aiVerificationScore && (
                  <span className="ml-1">
                    (score:{" "}
                    {Math.round(
                      milestone.progress[0].aiVerificationScore * 100,
                    )}
                    %)
                  </span>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={SparklesIcon}
                className="w-5 h-5 text-primary"
              />
              AI Skill Verification
            </DialogTitle>
            <DialogDescription>
              Answer the question below to verify your understanding of{" "}
              {milestone.title}.
            </DialogDescription>
          </DialogHeader>

          {verificationState === "loading" && (
            <div className="flex flex-col justify-center items-center py-8">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="w-8 h-8 text-primary animate-spin"
              />
              <p className="mt-4 text-muted-foreground text-sm">
                {verificationResult
                  ? "Evaluating your answer..."
                  : "Generating question..."}
              </p>
            </div>
          )}

          {verificationState === "question" && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium text-foreground">{question}</p>
              </div>
              <Textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitAnswer} disabled={!answer.trim()}>
                  <HugeiconsIcon icon={PlayIcon} className="mr-2 w-4 h-4" />
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {verificationState === "result" && verificationResult && (
            <div className="space-y-4">
              <div
                className={`rounded-lg p-4 ${
                  verificationResult.passed
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-orange-500/10 border border-orange-500/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {verificationResult.passed ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="w-5 h-5 text-green-600"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      className="w-5 h-5 text-orange-600"
                    />
                  )}
                  <span
                    className={`font-semibold ${
                      verificationResult.passed
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {verificationResult.passed
                      ? "Great job!"
                      : "Keep practicing!"}
                  </span>
                  <span className="ml-auto text-muted-foreground text-sm">
                    Score: {Math.round(verificationResult.score * 100)}%
                  </span>
                </div>
                <p className="text-foreground/80 text-sm">
                  {verificationResult.feedback}
                </p>
              </div>
              <Button onClick={closeDialog} className="w-full">
                {verificationResult.passed ? "Continue" : "Try Again Later"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
