"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitServerAction } from "@/lib/actions/skill-test";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Question {
  id: string;
  type: "code" | "scenario" | "explain";
  skillId: string;
  skillName: string;
  category: "hard" | "soft";
  question: string;
  context?: string;
}

interface SkillTestFormProps {
  questions: Question[];
  selfEvaluations: Array<{
    skillId: string;
    level: number;
    skillName: string;
  }>;
}

export function SkillTestForm({
  questions,
  selfEvaluations,
}: SkillTestFormProps) {
  const router = useRouter();
  const assessment = useAssessment();
  const assessmentId = assessment.id;
  const [isPending, startTransition] = useTransition();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");

  // Build map from selfEvaluations array
  const selfEvalMap = new Map(
    selfEvaluations.map((e) => [
      e.skillId,
      { level: e.level, skillName: e.skillName },
    ])
  );

  const currentQuestion = questions[currentQuestionIndex];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    const updatedAnswers = { ...answers, [currentQuestion.id]: currentAnswer };
    setAnswers(updatedAnswers);
    setCurrentAnswer("");

    if (isLastQuestion) {
      handleSubmit(updatedAnswers);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = questions[currentQuestionIndex - 1];
      setCurrentAnswer(answers[prevQuestion.id] || "");
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!assessmentId || isPending) return;

    startTransition(async () => {
      try {
        const submissions = questions.map((q) => ({
          skillId: q.skillId,
          question: q.question,
          answer: finalAnswers[q.id] || "",
        }));

        await submitServerAction({ assessmentId, submissions });
      } catch (err) {
        // Suppress alert for redirects
        if (
          err instanceof Error &&
          (err.message.includes("NEXT_REDIRECT") ||
            (typeof err === "object" &&
              "digest" in err &&
              typeof err.digest === "string" &&
              err.digest.includes("NEXT_REDIRECT")))
        ) {
          return;
        }
        console.error("Server submission failed:", err);
        alert("Failed to submit answers. Please try again.");
      }
    });
  };

  const getTypeLabel = (type: Question["type"]) => {
    switch (type) {
      case "code":
        return "Technical";
      case "scenario":
        return "Scenario";
      case "explain":
        return "Explain";
    }
  };

  const getTypeColor = (type: Question["type"]) => {
    switch (type) {
      case "code":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "scenario":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "explain":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
    }
  };

  // If no questions to test, show empty state
  if (questions.length === 0) {
    return (
      <Card className="bg-card p-8">
        <div className="flex flex-col justify-center items-center py-12 text-center">
          <p className="mb-4 text-muted-foreground">
            No skills selected for testing. Proceeding to next step...
          </p>
          <div className="inline-block">
            <div className="border-primary border-b-2 rounded-full w-8 h-8 animate-spin" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 mx-auto pb-12">
      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="font-semibold text-primary text-xs uppercase tracking-wider">
              Skill Assessment
            </span>
            <p className="font-medium text-foreground text-sm">
              Question {currentQuestionIndex + 1}{" "}
              <span className="text-muted-foreground">
                of {questions.length}
              </span>
            </p>
          </div>
          <span className="font-bold text-foreground text-sm">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="bg-muted ring-border/50 rounded-full ring-1 w-full h-2.5 overflow-hidden">
          <div
            className="bg-primary bg-gradient-to-r from-primary/80 to-primary shadow-lg shadow-primary/20 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="group relative bg-card shadow-black/5 shadow-lg p-8 border-border/50 overflow-hidden">
        <div className="top-0 right-0 absolute opacity-10 group-hover:opacity-20 p-4 transition-opacity pointer-events-none">
          <span className="font-serif font-bold text-primary text-9xl">?</span>
        </div>

        <div className="z-10 relative space-y-6">
          <div className="flex items-center gap-3">
            <Badge
              className={`${getTypeColor(
                currentQuestion.type
              )} border-transparent px-3 py-1 font-medium bg-opacity-20`}
            >
              {getTypeLabel(currentQuestion.type)}
            </Badge>
            <div className="bg-border w-px h-4" />
            <span className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
              {currentQuestion.skillName}
            </span>
          </div>

          <div className="space-y-4">
            {currentQuestion.context && (
              <div className="bg-muted/50 p-4 border-primary/50 border-l-4 rounded-lg text-muted-foreground text-sm italic leading-relaxed">
                {currentQuestion.context}
              </div>
            )}

            <h2 className="font-medium text-foreground text-xl md:text-2xl leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        <div className="z-10 relative space-y-6 mt-8">
          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={8}
            className="bg-background/50 focus:bg-background shadow-inner p-4 border-border/60 focus:border-primary/50 text-base leading-relaxed transition-all resize-none"
          />

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isPending}
              className="hover:bg-muted/50"
            >
              ← Back
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCurrentAnswer("");
                  if (!isLastQuestion) {
                    setCurrentQuestionIndex((prev) => prev + 1);
                  } else {
                    handleSubmit(answers);
                  }
                }}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Question
              </Button>

              <Button
                onClick={handleNext}
                disabled={!currentAnswer.trim() || isPending}
                className="shadow-lg shadow-primary/20 px-8 rounded-full"
                size="lg"
              >
                {isPending
                  ? "Submitting..."
                  : isLastQuestion
                  ? "Finish Assessment"
                  : "Next Question →"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Help text */}
      <div className="flex items-start gap-3 bg-blue-500/5 p-4 border border-blue-500/10 rounded-xl">
        <span className="text-xl">💡</span>
        <div className="space-y-1 text-foreground/80 text-sm">
          <p className="font-medium text-foreground">Tip for success</p>
          <p className="leading-relaxed">
            We&apos;re analyzing your problem-solving approach, not just the
            final code. Explain your reasoning ("why") alongside your solution
            ("how"). Real-world examples boost your score.
          </p>
        </div>
      </div>
    </div>
  );
}
