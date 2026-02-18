"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  InputField,
  RadioGroupField,
  SelectField,
} from "@/components/ui/rhf-inputs";
import { client } from "@/lib/orpc/client";
import { showError, showSuccess } from "@/lib/toast";
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
    },
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
    },
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

  const onSubmit = async (data: ProfileSetupData) => {
    startTransition(async () => {
      try {
        const finalRole =
          data.currentRole === "Other" && data.customRole
            ? data.customRole
            : data.currentRole;
        const finalIndustry =
          data.industry === "Other" && data.customIndustry
            ? data.customIndustry
            : data.industry;

        const assessment = await client.assessment.start({
          currentRole: finalRole,
          yearsExperience: data.yearsExperience,
          industry: finalIndustry,
          careerIntent: data.careerIntent,
        });

        showSuccess("Profile saved successfully!");
        router.push(`/assessment/${assessment.id}/goal`);
      } catch (error) {
        showError(error);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="gap-6 grid md:grid-cols-2">
        {/* Role & Experience */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary/10 p-1.5 rounded-md text-primary">
                💼
              </span>
              Professional Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <SelectField
                label="Current Role"
                control={form.control}
                name="currentRole"
                placeholder="Select your current role"
                required
                options={ROLES.map((role) => ({ value: role, label: role }))}
              />

              {currentRole === "Other" && (
                <div className="slide-in-from-top-2 animate-in fade-in">
                  <InputField
                    label="Specific Job Title"
                    control={form.control}
                    name="customRole"
                    placeholder="e.g. AI Prompt Engineer"
                    required
                    disabled={isPending}
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SelectField
                label="Years of Experience"
                control={form.control}
                name="yearsExperience"
                placeholder="Select range"
                required
                options={["0-2", "3-5", "6-10", "10+"].map((r) => ({
                  value: r,
                  label: r,
                }))}
              />

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
                  <div className="slide-in-from-top-2 animate-in fade-in">
                    <InputField
                      label="Specific Industry"
                      control={form.control}
                      name="customIndustry"
                      placeholder="e.g. Aerospace"
                      required
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Intent */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-blue-500/10 p-1.5 rounded-md text-blue-500">
                🚀
              </span>
              Career Goals
            </CardTitle>
            <CardDescription>Where do you want to go next?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroupField
              label="My current objective is to..."
              control={form.control}
              name="careerIntent"
              options={CAREER_INTENTS.map((i) => ({
                value: i.value,
                label: i.label,
                description: i.description,
              }))}
              required
              className="gap-4 grid grid-cols-1"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <LoadingButton
          type="submit"
          loading={isPending}
          loadingText="Saving profile..."
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 px-8 rounded-full w-full sm:w-auto transition-all"
          size="lg"
        >
          Continue
        </LoadingButton>
      </div>
    </form>
  );
}
