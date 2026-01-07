"use client";

import { client } from "@/lib/orpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PROCESSING_STEPS = [
  { id: 1, text: "Analyzing your self-assessment...", duration: 2000 },
  { id: 2, text: "Evaluating your responses...", duration: 3000 },
  { id: 3, text: "Processing evidence...", duration: 2500 },
  { id: 4, text: "Comparing with career requirements...", duration: 3000 },
  { id: 5, text: "Identifying skill gaps...", duration: 2000 },
  { id: 6, text: "Generating personalized recommendations...", duration: 2500 },
];

interface ProcessingContentProps {
  assessmentId: string;
}

export function ProcessingContent({ assessmentId }: ProcessingContentProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const processSteps = async () => {
      try {
        for (let i = 0; i < PROCESSING_STEPS.length; i++) {
          setCurrentStep(i);
          await new Promise((resolve) => {
            timeout = setTimeout(resolve, PROCESSING_STEPS[i].duration);
          });
        }

        // Finalize assessment to mark as completed
        await client.assessment.finalize({
          assessmentId,
        });

        // Navigate to results with assessment ID
        router.push(`/assessment/results?assessmentId=${assessmentId}`);
      } catch (err) {
        console.error("Assessment finalization failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to process assessment"
        );
      }
    };

    processSteps();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [router, assessmentId]);

  const progress = ((currentStep + 1) / PROCESSING_STEPS.length) * 100;

  if (error) {
    return (
      <div className="flex justify-center items-center bg-background px-4 min-h-screen">
        <div className="space-y-6 w-full max-w-md text-center">
          <div className="flex justify-center items-center bg-red-500/10 mx-auto rounded-full w-24 h-24">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="font-bold text-foreground text-2xl">
              Something went wrong
            </h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/assessment/start")}
            className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg text-primary-foreground"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-background px-4 min-h-screen">
      <div className="space-y-8 w-full max-w-md text-center">
        {/* Animated icon */}
        <div className="flex justify-center items-center mx-auto w-24 h-24">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="absolute inset-2 flex justify-center items-center bg-primary rounded-full">
              <svg
                className="w-10 h-10 text-primary-foreground animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-bold text-foreground text-3xl">
            Analyzing Your Skills
          </h1>
          <p className="text-muted-foreground">
            This will take about 15 seconds...
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="bg-muted rounded-full w-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current step text */}
          <div className="min-h-[24px]">
            {PROCESSING_STEPS[currentStep] && (
              <p className="text-foreground text-sm animate-fade-in">
                {PROCESSING_STEPS[currentStep].text}
              </p>
            )}
          </div>
        </div>

        {/* Bottom message */}
        <div className="bg-muted/50 p-4 rounded-lg text-muted-foreground text-sm">
          <p>
            We&apos;re using AI to compare your skills with industry standards
            and identify the most impactful areas for growth.
          </p>
        </div>
      </div>
    </div>
  );
}
