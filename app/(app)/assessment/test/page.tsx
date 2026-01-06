import { SkillTestForm } from "@/components/assessment/skill-test-form";
import { assessSkill } from "@/lib/ai/assessSkill";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers, headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Server action to process submitted answers and redirect server-side on success
export async function submitAssessmentAnswersAction(payload: {
  assessmentId: string;
  submissions: Array<{ skillId: string; question: string; answer: string }>;
}) {
  "use server";

  const { assessmentId, submissions } = payload;

  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session) {
    return redirect("/login?redirect=/assessment/test");
  }

  // Verify assessment belongs to user
  const assessment = await db.assessment.findFirst({
    where: { id: assessmentId, userId: session.user.id },
    include: { results: true },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  // Process each submission: either use self-eval fallback or call AI and upsert
  for (const s of submissions) {
    const answer = (s.answer || "").trim();

    if (!answer) {
      // If there's already a self-eval result for this skill, leave it as-is
      const existing = assessment.results.find((r) => r.skillId === s.skillId);
      if (!existing) {
        // No self-eval exists — create a placeholder low-confidence entry
        await db.assessmentResult.create({
          data: {
            assessmentId,
            skillId: s.skillId,
            level: 0,
            confidence: 0.2,
            notes: "No answer provided; placeholder created.",
          },
        });
      }
      continue;
    }

    // Call AI evaluation
    const evaluation = await assessSkill({
      skillId: s.skillId,
      skillName: "", // optional, will be validated in assessSkill if needed
      skillCategory: "HARD",
      question: s.question,
      answer,
    });

    // Upsert assessment result
    const existing = await db.assessmentResult.findFirst({
      where: { assessmentId, skillId: s.skillId },
    });

    if (existing) {
      await db.assessmentResult.update({
        where: { id: existing.id },
        data: {
          level: evaluation.level,
          confidence: evaluation.confidence,
          notes: evaluation.notes,
          rawAIOutput: {
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
          },
        },
      });
    } else {
      await db.assessmentResult.create({
        data: {
          assessmentId,
          skillId: s.skillId,
          level: evaluation.level,
          confidence: evaluation.confidence,
          notes: evaluation.notes,
          rawAIOutput: {
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
          },
        },
      });
    }
  }

  // On success, perform a server-side redirect to the evidence step
  return redirect(`/assessment/evidence?assessmentId=${assessmentId}`);
}

function TestSkeleton() {
  return (
    <div className="mx-auto px-4 py-12 max-w-3xl">
      <div className="space-y-6">
        <div className="bg-muted rounded w-32 h-8 animate-pulse" />
        <div className="bg-muted rounded h-screen animate-pulse" />
      </div>
    </div>
  );
}

async function TestContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/assessment/test");
  }

  return (
    <div className="bg-transparent min-h-screen">
      <div className="mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-2 mb-8">
          <div className="text-muted-foreground text-sm">Step 4 of 6</div>
          <h1 className="font-bold text-foreground text-3xl">
            Skill Validation
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s validate your strengths with a few questions. Take your
            time - this helps us give you better recommendations.
          </p>
        </div>

        <SkillTestForm submitServerAction={submitAssessmentAnswersAction} />
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<TestSkeleton />}>
      <TestContent />
    </Suspense>
  );
}
