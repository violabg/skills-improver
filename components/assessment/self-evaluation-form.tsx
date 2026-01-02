"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface SkillRating {
  id: string;
  name: string;
  category: "hard" | "soft" | "meta";
  rating: number | null;
}

const SKILLS: Array<Omit<SkillRating, "rating">> = [
  // Hard Skills
  { id: "react", name: "React/Frontend Frameworks", category: "hard" },
  { id: "typescript", name: "TypeScript", category: "hard" },
  { id: "testing", name: "Testing & Quality Assurance", category: "hard" },
  { id: "api", name: "API Design & Integration", category: "hard" },
  { id: "database", name: "Database Design", category: "hard" },
  { id: "architecture", name: "System Architecture", category: "hard" },

  // Soft Skills
  { id: "communication", name: "Technical Communication", category: "soft" },
  { id: "collaboration", name: "Team Collaboration", category: "soft" },
  { id: "problemsolving", name: "Problem Solving", category: "soft" },
  { id: "mentoring", name: "Mentoring Others", category: "soft" },
  { id: "feedback", name: "Giving/Receiving Feedback", category: "soft" },

  // Meta Skills
  { id: "learning", name: "Learning New Technologies", category: "meta" },
  { id: "prioritization", name: "Work Prioritization", category: "meta" },
  { id: "adaptability", name: "Adapting to Change", category: "meta" },
  { id: "ownership", name: "Taking Ownership", category: "meta" },
];

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
  const [isPending, startTransition] = useTransition();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const handleRatingChange = (skillId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [skillId]: rating }));
  };

  const allRated = SKILLS.every((skill) => ratings[skill.id] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRated || isPending) return;

    startTransition(async () => {
      try {
        // TODO: Save self-evaluation via oRPC
        // await orpc.assessment.saveSelfEvaluation({ ratings })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        router.push("/assessment/test");
      } catch (error) {
        console.error("Failed to save self-evaluation:", error);
      }
    });
  };

  const getCategoryTitle = (category: "hard" | "soft" | "meta") => {
    switch (category) {
      case "hard":
        return "Technical Skills";
      case "soft":
        return "Interpersonal Skills";
      case "meta":
        return "Learning & Adaptability";
    }
  };

  const groupedSkills = SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof SKILLS>);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {(["hard", "soft", "meta"] as const).map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="font-semibold text-foreground text-xl">
            {getCategoryTitle(category)}
          </h2>

          <div className="space-y-6">
            {groupedSkills[category]?.map((skill) => (
              <Card key={skill.id} className="bg-card p-6">
                <Label className="block mb-4 font-medium text-foreground text-sm">
                  {skill.name}
                </Label>

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
                      <div className="mt-1 text-xs">
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
            {Object.keys(ratings).length} of {SKILLS.length} rated
          </p>
          <Button type="submit" disabled={!allRated || isPending}>
            {isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
