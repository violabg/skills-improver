"use client";

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

export function ProcessingContent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStep(i);
        await new Promise((resolve) => {
          timeout = setTimeout(resolve, PROCESSING_STEPS[i].duration);
        });
      }

      // TODO: Trigger AI evaluation via oRPC
      // await orpc.assessment.processResults()

      // Navigate to results
      router.push("/assessment/results");
    };

    processSteps();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [router]);

  const progress = ((currentStep + 1) / PROCESSING_STEPS.length) * 100;

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
            We're using AI to compare your skills with industry standards and
            identify the most impactful areas for growth.
          </p>
        </div>
      </div>
    </div>
  );
}
