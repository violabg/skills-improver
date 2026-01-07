"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/lib/orpc/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface Question {
  id: string;
  type: "code" | "scenario" | "explain";
  skillId: string; // Add actual skill ID
  skillName: string; // Display name
  category: "hard" | "soft";
  question: string;
  context?: string;
}

// Sample questions bank - we'll select a subset (3-5) to ask
const QUESTIONS_BANK: Omit<Question, "skillId">[] = [
  {
    id: "q1",
    type: "code",
    skillName: "React",
    category: "hard",
    question:
      "What would happen if you call setState multiple times in the same event handler? Explain how React batches updates.",
    context: "Understanding React's rendering behavior",
  },
  {
    id: "q2",
    type: "explain",
    skillName: "TypeScript",
    category: "hard",
    question:
      "Explain when you would use a 'type' versus an 'interface' in TypeScript. What are the key differences?",
  },
  {
    id: "q3",
    type: "scenario",
    skillName: "Communication",
    category: "soft",
    question:
      "You've discovered a critical bug in production that was caused by another team member's code. How would you approach this situation?",
    context: "Demonstrating empathy and problem-solving",
  },
  {
    id: "q4",
    type: "code",
    skillName: "Testing",
    category: "hard",
    question:
      "What's the difference between unit tests, integration tests, and end-to-end tests? When would you use each?",
  },
  {
    id: "q5",
    type: "scenario",
    skillName: "Collaboration",
    category: "soft",
    question:
      "Your team is split on a technical decision. You disagree with the majority. How do you handle this?",
    context: "Working effectively in teams",
  },
  {
    id: "q6",
    type: "code",
    skillName: "API Design",
    category: "hard",
    question:
      "How would you design a RESTful API for a user management system? What endpoints and methods would you include?",
  },
  {
    id: "q7",
    type: "explain",
    skillName: "System Architecture",
    category: "hard",
    question:
      "Explain the trade-offs between microservices and monolithic architecture. When would you choose one over the other?",
  },
  {
    id: "q8",
    type: "scenario",
    skillName: "Problem Solving",
    category: "soft",
    question:
      "Your team is facing a critical deadline, but you've identified a significant technical debt issue. How would you handle this?",
  },
];

type ServerSubmission = (payload: {
  assessmentId: string;
  submissions: Array<{ skillId: string; question: string; answer: string }>;
}) => Promise<void>;

export function SkillTestForm({
  submitServerAction,
}: {
  submitServerAction?: ServerSubmission;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const [isPending, startTransition] = useTransition();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillMappingErrors, setSkillMappingErrors] = useState<string[]>([]);
  const [selfEvaluations, setSelfEvaluations] = useState<
    Map<string, { level: number; skillName: string }>
  >(new Map());

  // Fetch actual skill IDs, self-evaluations, and select 3-5 questions
  useEffect(() => {
    const loadData = async () => {
      if (!assessmentId) return;

      try {
        // Fetch skills from database
        const skills = await client.skills.list();
        console.log("Loaded skills from DB:", skills);

        // Fetch existing assessment results (self-evaluations)
        const assessment = await client.assessment.getResults({ assessmentId });
        console.log("Assessment with results:", assessment);

        // Build self-evaluation map
        const selfEvalMap = new Map<
          string,
          { level: number; skillName: string }
        >();
        assessment.results.forEach((result) => {
          selfEvalMap.set(result.skillId, {
            level: result.level,
            skillName: result.skill.name,
          });
        });
        setSelfEvaluations(selfEvalMap);
        console.log(`Loaded ${selfEvalMap.size} self-evaluation results`);

        // Create a map of skill names to IDs
        const skillMap = new Map<string, string>();
        skills.forEach((skill) => {
          skillMap.set(skill.name, skill.id);
        });

        // Select 3-5 questions randomly from the bank
        const questionsToAsk = 3 + Math.floor(Math.random() * 3); // 3-5 questions
        const shuffled = [...QUESTIONS_BANK].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, questionsToAsk);

        // Map questions to skill IDs
        const mappingErrors: string[] = [];
        const updatedQuestions: Question[] = selectedQuestions
          .map((q) => {
            const foundId = skillMap.get(q.skillName);
            if (!foundId) {
              const errorMsg = `Skill "${q.skillName}" not found in database`;
              console.error(`❌ ${errorMsg}`);
              mappingErrors.push(errorMsg);
              return null;
            }
            console.log(`✅ Question "${q.skillName}": found ${foundId}`);
            return {
              ...q,
              skillId: foundId,
            };
          })
          .filter((q): q is Question => q !== null);

        setSkillMappingErrors(mappingErrors);
        setQuestionsList(updatedQuestions);

        console.log(
          `Selected ${updatedQuestions.length} questions for testing`
        );

        if (mappingErrors.length > 0) {
          console.warn(
            `\n⚠️ ${mappingErrors.length} skill(s) could not be mapped.`
          );
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setSkillMappingErrors(["Failed to load assessment data"]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assessmentId]);

  const currentQuestion = questionsList[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionsList.length) * 100;
  const isLastQuestion = currentQuestionIndex === questionsList.length - 1;

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
      const prevQuestion = questionsList[currentQuestionIndex - 1];
      setCurrentAnswer(answers[prevQuestion.id] || "");
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!assessmentId || isPending) return;

    // If a server action is provided, send all submissions in one server-side
    // call which can perform processing and redirect on success. Wrap in
    // startTransition so `isPending` becomes true while the action is in-flight
    // and the UI can be disabled using the same flag.
    if (submitServerAction) {
      startTransition(async () => {
        try {
          const submissions = questionsList.map((q) => ({
            skillId: q.skillId,
            question: q.question,
            answer: finalAnswers[q.id] || "",
          }));

          await submitServerAction({ assessmentId, submissions });
          // server action will redirect on success; if it returns, clear state
          return;
        } catch (err) {
          // Suppress alert for redirects which are caught as errors in server actions
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
          return;
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        console.log(`Submitting answers for assessment ${assessmentId}`);
        console.log("Final answers object:", finalAnswers);

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        // Submit each answer via oRPC for AI evaluation, or use self-eval for skipped
        for (const question of questionsList) {
          const answer = finalAnswers[question.id];

          // If skipped, use self-evaluation score instead
          if (!answer || answer.trim() === "") {
            console.log(
              `⏭️ Question skipped for ${question.skillName} - using self-evaluation score`
            );

            const selfEval = selfEvaluations.get(question.skillId);
            if (selfEval) {
              try {
                // Create a result using the self-evaluation score
                await client.assessment.submitAnswer({
                  assessmentId,
                  skillId: question.skillId,
                  question: question.question,
                  answer: `[Self-evaluation: ${selfEval.level}/5]`,
                });
                console.log(
                  `✅ Used self-evaluation for ${question.skillName}: level ${selfEval.level}`
                );
                skippedCount++;
                successCount++;
              } catch (error) {
                const errorMsg = `Failed to use self-eval for ${
                  question.skillName
                }: ${error instanceof Error ? error.message : String(error)}`;
                console.error(errorMsg, error);
                errors.push(errorMsg);
                failCount++;
              }
            } else {
              console.warn(
                `⚠️ No self-evaluation found for ${question.skillName}, skipping entirely`
              );
              skippedCount++;
            }
            continue;
          }

          // Validate skill ID is a real UUID, not a placeholder
          if (
            !question.skillId.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            )
          ) {
            const errorMsg = `❌ Invalid skill ID for ${question.skillName}: ${question.skillId}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            failCount++;
            continue;
          }

          try {
            console.log(
              `📤 Submitting answer for ${question.skillName} (${question.skillId})`
            );
            const result = await client.assessment.submitAnswer({
              assessmentId,
              skillId: question.skillId,
              question: question.question,
              answer: answer.trim(),
            });
            console.log(`✅ Answer saved for ${question.skillName}:`, result);
            successCount++;
          } catch (error) {
            const errorMsg = `Failed to submit ${question.skillName}: ${
              error instanceof Error ? error.message : String(error)
            }`;
            console.error(errorMsg, error);
            errors.push(errorMsg);
            failCount++;
          }
        }

        console.log(`\n📊 Submission Summary:`);
        console.log(`  ✅ Success: ${successCount}`);
        console.log(`  ❌ Failed: ${failCount}`);
        console.log(`  ⏭️ Used self-evaluation: ${skippedCount}`);

        if (errors.length > 0) {
          console.error("\n❌ Errors encountered:");
          errors.forEach((err) => console.error(`  - ${err}`));
        }

        if (successCount === 0 && failCount > 0) {
          alert(
            `Failed to submit any answers. Please check the console for details and try again.`
          );
          return;
          return;
        }

        if (failCount > 0) {
          const proceed = confirm(
            `${successCount} answer(s) submitted successfully, but ${failCount} failed. Continue to next step?`
          );
          if (!proceed) {
            return;
          }
        }

        // Move to next step - use replace to prevent back navigation issues
        console.log("Moving to evidence page");
        router.replace(`/assessment/evidence?assessmentId=${assessmentId}`);
      } catch (error) {
        console.error("Failed to submit answers:", error);
        alert("An unexpected error occurred. Please try again.");
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

  if (loading) {
    return (
      <Card className="bg-card p-8">
        <div className="flex justify-center items-center py-12">
          <div className="space-y-4 text-center">
            <div className="inline-block">
              <div className="border-primary border-b-2 rounded-full w-8 h-8 animate-spin" />
            </div>
            <p className="text-muted-foreground">
              Loading assessment questions...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skill mapping errors warning */}
      {skillMappingErrors.length > 0 && (
        <div className="bg-yellow-500/10 p-4 border border-yellow-500/50 rounded-lg">
          <h3 className="mb-2 font-medium text-yellow-700 dark:text-yellow-300">
            ⚠️ Skill Mapping Issues
          </h3>
          <p className="mb-2 text-yellow-600 dark:text-yellow-400 text-sm">
            Some questions could not be mapped to database skills. These answers
            may not be saved:
          </p>
          <ul className="space-y-1 text-yellow-600 dark:text-yellow-400 text-sm list-disc list-inside">
            {skillMappingErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questionsList.length}
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
                  // Don't add empty string to answers - just skip
                  setCurrentAnswer("");
                  if (!isLastQuestion) {
                    setCurrentQuestionIndex((prev) => prev + 1);
                  } else {
                    // On last question, skip and submit
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
