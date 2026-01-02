"use client";
import { RadioGroupField, SelectField } from "@/components/rhf-inputs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ProfileSetupSchema = z.object({
  currentRole: z.string().min(1, "Please select your role"),
  yearsExperience: z.string().min(1, "Please select years of experience"),
  industry: z.string().min(1, "Please select your industry"),
  careerIntent: z.string().min(1, "Please select your career intent"),
});

type ProfileSetupData = z.infer<typeof ProfileSetupSchema>;

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Engineer",
  "ML Engineer",
  "Product Manager",
  "Engineering Manager",
  "Tech Lead",
  "Other",
];

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "E-commerce",
  "Education",
  "Media",
  "Gaming",
  "Consulting",
  "Startup",
  "Other",
];

const CAREER_INTENTS = [
  {
    value: "GROW",
    label: "Grow in current role",
    description: "Deepen expertise and advance in my current path",
  },
  {
    value: "SWITCH",
    label: "Switch role",
    description: "Transition to a different role or specialization",
  },
  {
    value: "LEADERSHIP",
    label: "Move into leadership",
    description: "Transition from IC to management or tech leadership",
  },
];

export function ProfileSetupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileSetupData>({
    // @ts-expect-error - Zod version mismatch with @hookform/resolvers
    resolver: zodResolver(ProfileSetupSchema),
    defaultValues: {
      currentRole: "",
      yearsExperience: "",
      industry: "",
      careerIntent: "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(() => {
        startTransition(async () => {
          try {
            // TODO: Call oRPC assessment.start with data
            // For now, just navigate to next step
            router.push("/assessment/goal");
          } catch (error) {
            console.error("Failed to start assessment:", error);
          }
        });
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>Tell us about yourself</CardTitle>
          <CardDescription>
            This helps us personalize your skill assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Role */}
          <SelectField
            label="Current role"
            control={form.control}
            name="currentRole"
            placeholder="Select your role"
            required
            options={ROLES.map((role) => ({ value: role, label: role }))}
          />

          {/* Years Experience */}
          <SelectField
            label="Years of experience"
            control={form.control}
            name="yearsExperience"
            placeholder="Select range"
            required
            options={["0-2", "3-5", "6-10", "10+"].map((r) => ({
              value: r,
              label: r,
            }))}
          />

          {/* Industry */}
          <SelectField
            label="Industry"
            control={form.control}
            name="industry"
            placeholder="Select your industry"
            required
            options={INDUSTRIES.map((industry) => ({
              value: industry,
              label: industry,
            }))}
          />

          {/* Career Intent */}
          <RadioGroupField
            label="Career intent"
            control={form.control}
            name="careerIntent"
            options={CAREER_INTENTS.map((i) => ({
              value: i.value,
              label: i.label,
            }))}
            required
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={!form.formState.isValid || isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? "Starting..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
