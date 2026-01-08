"use client";
import {
  InputField,
  RadioGroupField,
  SelectField,
} from "@/components/rhf-inputs";
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
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ProfileSetupSchema = z
  .object({
    currentRole: z.string().min(1, "Please select your role"),
    customRole: z.string().optional(),
    yearsExperience: z.string().min(1, "Please select years of experience"),
    industry: z.string().min(1, "Please select your industry"),
    customIndustry: z.string().optional(),
    careerIntent: z.string().min(1, "Please select your career intent"),
  })
  .refine(
    (data) => {
      if (data.currentRole === "Other") {
        return !!data.customRole && data.customRole.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please specify your role",
      path: ["customRole"],
    }
  )
  .refine(
    (data) => {
      if (data.industry === "Other") {
        return !!data.customIndustry && data.customIndustry.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please specify your industry",
      path: ["customIndustry"],
    }
  );

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
    resolver: zodResolver(ProfileSetupSchema),
    defaultValues: {
      currentRole: "",
      customRole: "",
      yearsExperience: "",
      industry: "",
      customIndustry: "",
      careerIntent: "",
    },
  });

  const currentRole = form.watch("currentRole");
  const industry = form.watch("industry");

  return (
    <form
      onSubmit={form.handleSubmit((data) => {
        startTransition(async () => {
          try {
            // Use custom values if "Other" is selected
            const finalRole =
              data.currentRole === "Other" && data.customRole
                ? data.customRole
                : data.currentRole;
            const finalIndustry =
              data.industry === "Other" && data.customIndustry
                ? data.customIndustry
                : data.industry;

            // Call oRPC assessment.start with all profile data
            const assessment = await client.assessment.start({
              currentRole: finalRole,
              yearsExperience: data.yearsExperience,
              industry: finalIndustry,
              careerIntent: data.careerIntent,
            });

            // Navigate to next step with assessment ID
            if (assessment.id) {
              router.push(`/assessment/${assessment.id}/goal`);
            }
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
          <div className="space-y-4">
            <SelectField
              label="Current role"
              control={form.control}
              name="currentRole"
              placeholder="Select your role"
              required
              options={ROLES.map((role) => ({ value: role, label: role }))}
            />

            {currentRole === "Other" && (
              <InputField
                label="Your role title"
                control={form.control}
                name="customRole"
                placeholder="e.g. AI Prompt Engineer"
                required
                disabled={isPending}
              />
            )}
          </div>

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
          <div className="space-y-4">
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

            {industry === "Other" && (
              <InputField
                label="Your industry"
                control={form.control}
                name="customIndustry"
                placeholder="e.g. Aerospace"
                required
                disabled={isPending}
              />
            )}
          </div>

          {/* Career Intent */}
          <RadioGroupField
            label="Career intent"
            control={form.control}
            name="careerIntent"
            options={CAREER_INTENTS.map((i) => ({
              value: i.value,
              label: i.label,
              description: i.description,
            }))}
            required
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
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
