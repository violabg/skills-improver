"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/orpc/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

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

export function SelfEvaluationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const [isPending, startTransition] = useTransition();
  const [isFetchingSkills, setIsFetchingSkills] = useState(true);

  // Dynamic skills state
  const [skills, setSkills] = useState<
    Array<{ id: string; name: string; category: string }>
  >([]);
  const [reasoning, setReasoning] = useState<string>("");

  // Form state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [testMe, setTestMe] = useState<Record<string, boolean>>({});

  // Fetch skills on mount
  useEffect(() => {
    if (!assessmentId) return;

    let mounted = true;
    const fetchSkills = async () => {
      try {
        // Use the generation endpoint to get relevant skills for this specific profile
        const result = await client.skills.generateForProfile({ assessmentId });

        if (mounted) {
          setSkills(result.skills);
          setReasoning(result.reasoning);
          setIsFetchingSkills(false);

          // Initialize testMe defaults (e.g. maybe auto-select top skills?)
          // For now, default to false
        }
      } catch (error) {
        console.error("Failed to generate skills:", error);
        // Fallback or error state?
        setIsFetchingSkills(false);
      }
    };

    fetchSkills();
    return () => {
      mounted = false;
    };
  }, [assessmentId]);

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

    if (!allRated || isPending || !assessmentId) return;

    startTransition(async () => {
      try {
        const evaluations = Object.entries(ratings).map(([skillId, level]) => ({
          skillId,
          level,
          shouldTest: !!testMe[skillId],
        }));

        if (evaluations.length > 0) {
          await client.assessment.saveSelfEvaluations({
            assessmentId,
            evaluations,
          });
        }

        router.push(`/assessment/test?assessmentId=${assessmentId}`);
      } catch (error) {
        console.error("Failed to save self-evaluation:", error);
      }
    });
  };

  if (isFetchingSkills) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="bg-muted rounded w-1/3 h-8 animate-pulse" />
          <div className="bg-muted rounded w-2/3 h-4 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted rounded-lg w-full h-40 animate-pulse"
            />
          ))}
        </div>
        <div className="text-muted-foreground text-sm text-center animate-pulse">
          Analyzing your profile and generating relevant skills...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {reasoning && (
        <div className="bg-muted/50 p-4 border border-border rounded-lg text-sm">
          <p className="mb-1 font-medium">AI Recommendation:</p>
          <p className="text-muted-foreground">{reasoning}</p>
        </div>
      )}

      {Object.entries(groupedSkills).map(([category, catSkills]) => (
        <div key={category} className="space-y-4">
          <h2 className="font-semibold text-foreground text-xl capitalize">
            {getCategoryTitle(category)}
          </h2>

          <div className="space-y-6">
            {catSkills.map((skill) => (
              <Card key={skill.id} className="bg-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <Label className="font-medium text-foreground text-base">
                    {skill.name}
                  </Label>

                  {/* Test Me Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTestMe(skill.id)}
                    className={`
                      text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-2
                      ${
                        testMe[skill.id]
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }
                    `}
                  >
                    {testMe[skill.id] ? "✓ Will Test" : "+ Test Me"}
                  </button>
                </div>

                <div className="gap-2 grid grid-cols-5">
                  {CONFIDENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleRatingChange(skill.id, level.value)}
                      className={`
                        border-2 rounded-lg p-3 text-center text-sm transition-all
                        ${
                          ratings[skill.id] === level.value
                            ? `${level.color} font-semibold scale-105`
                            : "border-border bg-card/50 hover:bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      <div className="font-bold text-lg">{level.value}</div>
                      <div className="hidden sm:block mt-1 text-xs">
                        {level.label.split(" - ")[1]}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Back
        </Button>

        <div className="flex items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {Object.keys(ratings).length} of {skills.length} rated
          </p>
          <Button type="submit" disabled={!allRated || isPending}>
            {isPending ? "Saving..." : "Continue to Test"}
          </Button>
        </div>
      </div>
    </form>
  );
}
