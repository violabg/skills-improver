"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputField } from "@/components/ui/rhf-inputs";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { client } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
    },
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
  const assessment = useAssessment();
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
            // Store the goal in session state and navigate to next step
            // Persist selected goal to the assessment (best-effort)
            const goal =
              data.goalType === "custom" ? data.customGoal : data.goalType;

            try {
              await client.assessment.updateGoal({
                assessmentId: assessment.id,
                targetRole: goal as string,
              });
            } catch (err) {
              // Log and continue navigation; saving is best-effort

              console.error("Failed to save goal:", err);
            }

            router.push(`/assessment/${assessment.id}/self-evaluation`);
          } catch (error) {
            console.error("Failed to save goal:", error);
          }
        });
      })}
      className="space-y-8 mx-auto"
    >
      <div className="space-y-6">
        <Card className="shadow-sm border-border/50 overflow-hidden">
          <div className="bg-muted/30 p-6 border-border/50 border-b">
            <h2 className="flex items-center gap-2 font-semibold text-lg">
              <span className="bg-green-500/10 p-1.5 rounded-md text-green-600">
                🎯
              </span>
              Select Your Target Path
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Choose a common career progression or define your own.
            </p>
          </div>
          <CardContent className="p-6">
            <div className="gap-4 grid sm:grid-cols-2">
              {COMMON_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => form.setValue("goalType", goal.id)}
                  disabled={isPending}
                  className={`
                    relative group flex flex-col items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    ${
                      form.getValues("goalType") === goal.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
                    }
                  `}
                >
                  <div
                    className={`
                    p-3 rounded-xl transition-colors
                    ${
                      form.getValues("goalType") === goal.id
                        ? "bg-primary/20"
                        : "bg-muted group-hover:bg-background"
                    }
                  `}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-foreground text-base">
                      {goal.title}
                    </div>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      {goal.description}
                    </div>
                  </div>
                  {form.getValues("goalType") === goal.id && (
                    <div className="top-4 right-4 absolute text-primary">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => form.setValue("goalType", "custom")}
                disabled={isPending}
                className={`
                   relative group flex flex-col items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200
                   hover:shadow-md hover:-translate-y-0.5
                   ${
                     form.getValues("goalType") === "custom"
                       ? "border-primary bg-primary/5 shadow-sm"
                       : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30"
                   }
                `}
              >
                <div
                  className={`
                    p-3 rounded-xl transition-colors
                    ${
                      form.getValues("goalType") === "custom"
                        ? "bg-primary/20"
                        : "bg-muted group-hover:bg-background"
                    }
                  `}
                >
                  <span className="text-2xl">✏️</span>
                </div>
                <div>
                  <div className="mb-1 font-semibold text-foreground text-base">
                    Custom Goal
                  </div>
                  <div className="text-muted-foreground text-sm leading-relaxed">
                    Define a specific role or specialized path not listed above
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {goalType === "custom" && (
          <div className="slide-in-from-bottom-2 animate-in fade-in">
            <Card className="border-border/50">
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
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <Button
            type="submit"
            disabled={!goalType || isPending}
            size="lg"
            className="shadow-lg shadow-primary/20 px-8 rounded-full"
          >
            {isPending ? "Saving..." : "Continue →"}
          </Button>
        </div>
      </div>
    </form>
  );
}
