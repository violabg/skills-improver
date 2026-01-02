"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Question {
  id: string;
  type: "code" | "scenario" | "explain";
  skill: string;
  category: "hard" | "soft";
  question: string;
  context?: string;
}

// Sample questions - in production these would come from oRPC based on self-evaluation
const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "code",
    skill: "React",
    category: "hard",
    question:
      "What would happen if you call setState multiple times in the same event handler? Explain how React batches updates.",
    context: "Understanding React's rendering behavior",
  },
  {
    id: "q2",
    type: "explain",
    skill: "TypeScript",
    category: "hard",
    question:
      "Explain when you would use a 'type' versus an 'interface' in TypeScript. What are the key differences?",
  },
  {
    id: "q3",
    type: "scenario",
    skill: "Communication",
    category: "soft",
    question:
      "You've discovered a critical bug in production that was caused by another team member's code. How would you approach this situation?",
    context: "Demonstrating empathy and problem-solving",
  },
  {
    id: "q4",
    type: "code",
    skill: "Testing",
    category: "hard",
    question:
      "What's the difference between unit tests, integration tests, and end-to-end tests? When would you use each?",
  },
  {
    id: "q5",
    type: "scenario",
    skill: "Collaboration",
    category: "soft",
    question:
      "Your team is split on a technical decision. You disagree with the majority. How do you handle this?",
    context: "Working effectively in teams",
  },
];

export function SkillTestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: currentAnswer }));
    setCurrentAnswer("");

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = QUESTIONS[currentQuestionIndex - 1];
      setCurrentAnswer(answers[prevQuestion.id] || "");
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      try {
        // TODO: Submit answers via oRPC for AI evaluation
        // await orpc.assessment.submitAnswers({ answers })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        router.push("/assessment/evidence");
      } catch (error) {
        console.error("Failed to submit answers:", error);
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

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {QUESTIONS.length}
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
            <Badge variant="outline">{currentQuestion.skill}</Badge>
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
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: "" }));
                  setCurrentAnswer("");
                  if (!isLastQuestion) {
                    setCurrentQuestionIndex((prev) => prev + 1);
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
          💡 <strong>Tip:</strong> We're looking for your thinking process, not
          perfect answers. Explain your reasoning and share real examples where
          possible.
        </p>
      </div>
    </div>
  );
}
