"use client";

import { InputField } from "@/components/rhf-inputs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { client } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CareerGoalSchema = z
  .object({
    goalType: z.string().min(1, "Please select a career goal"),
    customGoal: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.goalType === "custom") {
        return data.customGoal && data.customGoal.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please describe your custom goal",
      path: ["customGoal"],
    }
  );

type CareerGoalData = z.infer<typeof CareerGoalSchema>;

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
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const [isPending, startTransition] = useTransition();
  const form = useForm<CareerGoalData>({
    resolver: zodResolver(CareerGoalSchema),
    defaultValues: {
      goalType: "",
      customGoal: "",
    },
  });

  const goalType = form.watch("goalType");

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        startTransition(async () => {
          try {
            if (!assessmentId) {
              throw new Error("Assessment ID is missing");
            }

            // Store the goal in session state and navigate to next step
            // Persist selected goal to the assessment (best-effort)
            const goal =
              data.goalType === "custom" ? data.customGoal : data.goalType;
            const goalParam = goal ? encodeURIComponent(goal) : "";

            try {
              await client.assessment.updateGoal({
                assessmentId,
                targetRole: goal as string,
              });
            } catch (err) {
              // Log and continue navigation; saving is best-effort

              console.error("Failed to save goal:", err);
            }

            router.push(
              `/assessment/self-evaluation?assessmentId=${assessmentId}&goal=${goalParam}`
            );
          } catch (error) {
            console.error("Failed to save goal:", error);
          }
        });
      })}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Common Career Paths</CardTitle>
            <CardDescription>
              Based on your profile, these are popular next steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {COMMON_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => form.setValue("goalType", goal.id)}
                  disabled={isPending}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    form.getValues("goalType") === goal.id
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
                onClick={() => form.setValue("goalType", "custom")}
                disabled={isPending}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  form.getValues("goalType") === "custom"
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
            </div>
          </CardContent>
        </Card>

        {goalType === "custom" && (
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Goal</CardTitle>
              <CardDescription>
                What specific role or position are you targeting?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InputField
                label="Target role or goal"
                control={form.control}
                name="customGoal"
                placeholder="e.g., Principal Engineer, Staff Designer, VP Engineering"
                disabled={isPending}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="w-32"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={!goalType || isPending}
            className="flex-1"
            size="lg"
          >
            {isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
