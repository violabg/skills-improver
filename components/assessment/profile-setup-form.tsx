"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentRole: "",
    yearsExperience: "",
    industry: "",
    careerIntent: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Call oRPC assessment.start
      // For now, just navigate to next step
      router.push("/assessment/goal");
    } catch (error) {
      console.error("Failed to start assessment:", error);
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    formData.currentRole &&
    formData.yearsExperience &&
    formData.industry &&
    formData.careerIntent;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Tell us about yourself</CardTitle>
          <CardDescription>
            This helps us personalize your skill assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Current role</Label>
            <Select
              value={formData.currentRole}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currentRole: value }))
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Years Experience */}
          <div className="space-y-2">
            <Label>Years of experience</Label>
            <div className="gap-3 grid grid-cols-2 sm:grid-cols-4">
              {["0-2", "3-5", "6-10", "10+"].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, yearsExperience: range }))
                  }
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    formData.yearsExperience === range
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, industry: value }))
              }
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Career Intent */}
          <div className="space-y-2">
            <Label>Career intent</Label>
            <div className="space-y-3">
              {CAREER_INTENTS.map((intent) => (
                <button
                  key={intent.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      careerIntent: intent.value,
                    }))
                  }
                  className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                    formData.careerIntent === intent.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-foreground">
                    {intent.label}
                  </div>
                  <div className="mt-1 text-muted-foreground text-sm">
                    {intent.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isValid || loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Starting..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
