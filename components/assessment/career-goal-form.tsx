"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

const COMMON_GOALS = [
  {
    id: "frontend-senior",
    title: "Frontend → Senior Frontend",
    description: "Advance to senior individual contributor role",
    icon: "📈",
  },
  {
    id: "dev-lead",
    title: "Developer → Tech Lead",
    description: "Transition to technical leadership",
    icon: "🎯",
  },
  {
    id: "ic-manager",
    title: "IC → Manager",
    description: "Move into people management",
    icon: "👥",
  },
  {
    id: "backend-fullstack",
    title: "Backend → Full Stack",
    description: "Expand to full stack development",
    icon: "🔄",
  },
];

export function CareerGoalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Save goal to assessment session via oRPC
      // For now, just navigate to next step
      router.push("/assessment/self-evaluation");
    } catch (error) {
      console.error("Failed to save goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const isValid = selectedGoal || (showCustom && customGoal.trim());

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Common Career Paths</CardTitle>
            <CardDescription>
              Based on your profile, these are popular next steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {COMMON_GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setSelectedGoal(goal.id);
                  setShowCustom(false);
                }}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  selectedGoal === goal.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{goal.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">
                      {goal.title}
                    </div>
                    <div className="mt-1 text-muted-foreground text-sm">
                      {goal.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setShowCustom(true);
                setSelectedGoal(null);
              }}
              className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                showCustom
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">✏️</div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">
                    Custom Goal
                  </div>
                  <div className="mt-1 text-muted-foreground text-sm">
                    Define your own career target
                  </div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        {showCustom && (
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Goal</CardTitle>
              <CardDescription>
                What specific role or position are you targeting?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customGoal">Target role or goal</Label>
                <Input
                  id="customGoal"
                  placeholder="e.g., Principal Engineer, Staff Designer, VP Engineering"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-32"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={!isValid || loading}
            className="flex-1"
            size="lg"
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
