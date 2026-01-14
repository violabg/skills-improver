"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { client } from "@/lib/orpc/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const CONFIDENCE_LEVELS = [
  {
    value: 1,
    label: "1 - Just starting",
    color: "bg-red-500/20 hover:bg-red-500/30 border-red-500/50",
  },
  {
    value: 2,
    label: "2 - Learning",
    color: "bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/50",
  },
  {
    value: 3,
    label: "3 - Comfortable",
    color: "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50",
  },
  {
    value: 4,
    label: "4 - Confident",
    color: "bg-green-500/20 hover:bg-green-500/30 border-green-500/50",
  },
  {
    value: 5,
    label: "5 - Expert",
    color: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50",
  },
];

interface SelfEvaluationFormProps {
  skills: Array<{ id: string; name: string; category: string }>;
  reasoning: string;
}

export function SelfEvaluationForm({
  skills,
  reasoning,
}: SelfEvaluationFormProps) {
  const router = useRouter();
  const assessment = useAssessment();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [testMe, setTestMe] = useState<Record<string, boolean>>({});

  const handleRatingChange = (skillId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [skillId]: rating }));
  };

  const toggleTestMe = (skillId: string) => {
    setTestMe((prev) => ({ ...prev, [skillId]: !prev[skillId] }));
  };

  const getCategoryTitle = (category: string) => {
    switch (category.toLowerCase()) {
      case "hard":
        return "Technical Skills";
      case "soft":
        return "Interpersonal Skills";
      case "meta":
        return "Learning & Adaptability";
      default:
        return category;
    }
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const allRated =
    skills.length > 0 &&
    skills.every((skill) => ratings[skill.id] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRated || isPending) return;

    startTransition(async () => {
      try {
        const evaluations = Object.entries(ratings).map(([skillId, level]) => ({
          skillId,
          level,
          shouldTest: !!testMe[skillId],
        }));

        if (evaluations.length > 0) {
          await client.assessment.saveSelfEvaluations({
            assessmentId: assessment.id,
            evaluations,
          });
        }

        router.push(`/assessment/${assessment.id}/test`);
      } catch (error) {
        console.error("Failed to save self-evaluation:", error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mx-auto pb-12">
      {reasoning && (
        <div className="bg-primary/5 shadow-sm p-4 border border-primary/20 rounded-xl text-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="mb-1 font-semibold text-primary">
                AI Recommendation
              </p>
              <p className="text-foreground/80 leading-relaxed">{reasoning}</p>
            </div>
          </div>
        </div>
      )}

      {Object.entries(groupedSkills).map(([category, catSkills]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-border/50 border-b">
            <h2 className="flex items-center gap-2 font-bold text-foreground text-xl capitalize">
              {category.toLowerCase() === "hard" && (
                <span className="text-blue-500">🛠️</span>
              )}
              {category.toLowerCase() === "soft" && (
                <span className="text-green-500">🤝</span>
              )}
              {category.toLowerCase() === "meta" && (
                <span className="text-purple-500">🧠</span>
              )}
              {getCategoryTitle(category)}
            </h2>
            <span className="bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground text-xs">
              {catSkills.length} skills
            </span>
          </div>

          <div className="space-y-4">
            {catSkills.map((skill) => (
              <div
                key={skill.id}
                className="group bg-card hover:bg-muted/30 shadow-sm p-6 border border-border/50 hover:border-primary/20 rounded-xl transition-all"
              >
                <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4 mb-6">
                  <Label className="font-semibold text-foreground group-hover:text-primary text-lg transition-colors cursor-pointer">
                    {skill.name}
                  </Label>

                  {/* Test Me Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTestMe(skill.id)}
                    className={`
                      text-xs px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 self-start sm:self-auto
                      ${
                        testMe[skill.id]
                          ? "bg-primary/10 border-primary text-primary font-medium shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-muted"
                      }
                    `}
                  >
                    {testMe[skill.id] ? (
                      <>
                        <span className="bg-primary rounded-full w-1.5 h-1.5" />
                        Verify with AI Test
                      </>
                    ) : (
                      "+ Add AI Verification"
                    )}
                  </button>
                </div>

                <div className="gap-2 sm:gap-4 grid grid-cols-5">
                  {CONFIDENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleRatingChange(skill.id, level.value)}
                      className={`
                        relative group/btn flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all duration-200
                        ${
                          ratings[skill.id] === level.value
                            ? `${level.color} shadow-sm scale-105 z-10`
                            : "border-border/40 bg-background hover:bg-muted hover:border-border"
                        }
                      `}
                    >
                      <div
                        className={`
                        text-lg sm:text-2xl font-bold mb-1
                        ${
                          ratings[skill.id] === level.value
                            ? "text-foreground"
                            : "text-muted-foreground group-hover/btn:text-foreground"
                        }
                      `}
                      >
                        {level.value}
                      </div>
                      <div
                        className={`
                         hidden sm:block text-[10px] uppercase tracking-wider font-semibold
                         ${
                           ratings[skill.id] === level.value
                             ? "opacity-100"
                             : "opacity-40 group-hover/btn:opacity-80"
                         }
                      `}
                      >
                        {level.label.split(" - ")[1]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bottom-4 z-20 sticky flex justify-between items-center bg-background/80 shadow-2xl backdrop-blur-md mx-auto p-4 border border-border/50 rounded-full max-w-3xl">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          ← Back
        </Button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm">
            <span className="font-semibold text-foreground">
              {Object.keys(ratings).length}
            </span>
            <span className="text-muted-foreground">
              {" "}
              / {skills.length} rated
            </span>
          </div>
          <div className="hidden sm:block bg-border w-px h-4" />
          <Button
            type="submit"
            disabled={!allRated || isPending}
            className="shadow-lg shadow-primary/20 px-8 rounded-full"
          >
            {isPending ? "Saving..." : "Continue to Test →"}
          </Button>
        </div>
      </div>
    </form>
  );
}
