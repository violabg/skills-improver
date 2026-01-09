import { SkillTestForm } from "@/components/assessment/skill-test-form";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { serverClient } from "@/lib/orpc/orpc.server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface TestPageProps {
  params: Promise<{ id: string }>;
}

function TestSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-32 h-8" />
      <Skeleton className="h-100" />
    </div>
  );
}

// Server component that fetches questions
async function SkillTestFormLoader({ assessmentId }: { assessmentId: string }) {
  // 1. Fetch assessment results to find "shouldTest" skills
  const assessment = await serverClient.assessment.getResults({ assessmentId });

  // Build self-evaluation data and find skills to test
  const selfEvaluations: Array<{
    skillId: string;
    level: number;
    skillName: string;
  }> = [];
  const testSkillIds: string[] = [];

  assessment.results.forEach((result) => {
    selfEvaluations.push({
      skillId: result.skillId,
      level: result.level,
      skillName: result.skill.name,
    });

    if (result.shouldTest) {
      testSkillIds.push(result.skillId);
    }
  });

  // If no skills marked for testing, redirect to evidence
  if (testSkillIds.length === 0) {
    redirect(`/assessment/${assessmentId}/evidence`);
  }

  // 2. Generate questions for the selected skills
  const generatedQuestions = await serverClient.questions.generateForSkills({
    assessmentId,
    skillIds: testSkillIds,
  });

  // Map to ensure correct types
  const questions = generatedQuestions.map((q) => ({
    ...q,
    category:
      q.category === "hard" || q.category === "soft"
        ? q.category
        : ("hard" as const),
  }));

  return (
    <SkillTestForm questions={questions} selfEvaluations={selfEvaluations} />
  );
}

export default async function TestPage({ params }: TestPageProps) {
  const { id } = await params;

  return (
    <PageShell
      currentStep={4}
      totalSteps={7}
      title="Skill Validation"
      description="Let's validate your strengths with a few questions. Take your time - this helps us give you better recommendations."
      variant="default"
    >
      <Suspense fallback={<TestSkeleton />}>
        <SkillTestFormLoader assessmentId={id} />
      </Suspense>
    </PageShell>
  );
}
