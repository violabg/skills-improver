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
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="bg-muted rounded-full w-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="bg-card p-8">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Badge className={getTypeColor(currentQuestion.type)}>
              {getTypeLabel(currentQuestion.type)}
            </Badge>
            <Badge variant="outline">{currentQuestion.skillName}</Badge>
          </div>

          {currentQuestion.context && (
            <p className="text-muted-foreground text-sm italic">
              {currentQuestion.context}
            </p>
          )}

          <h2 className="font-medium text-foreground text-lg leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="space-y-4">
          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={8}
            className="resize-none"
          />

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
            >
              Back
            </Button>

            <div className="flex items-center gap-4">
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
                className="text-muted-foreground"
              >
                Skip
              </Button>

              <Button
                onClick={handleNext}
                disabled={!currentAnswer.trim() || isPending}
              >
                {isPending
                  ? "Submitting..."
                  : isLastQuestion
                  ? "Submit Answers"
                  : "Next Question"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Help text */}
      <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground text-sm">
        <p>
          💡 <strong>Tip:</strong> We&apos;re looking for your thinking process,
          not perfect answers. Explain your reasoning and share real examples
          where possible.
        </p>
        <p className="mt-2">
          ℹ️ If you skip a question, we&apos;ll use your self-evaluation score
          for that skill instead.
        </p>
      </div>
    </div>
  );
}
