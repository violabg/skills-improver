"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { client } from "@/lib/orpc/client";
import {
  Loading03Icon,
  MapsIcon,
  SparklesFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GenerateRoadmapPage() {
  const router = useRouter();
  const assessment = useAssessment();
  const [status, setStatus] = useState<
    "idle" | "generating" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessment) return;

    const generate = async () => {
      setStatus("generating");
      try {
        const roadmap = await client.roadmap.generate({
          assessmentId: assessment.id,
        });
        setStatus("success");
        // Redirect to the new roadmap
        setTimeout(() => {
          router.push("/roadmap");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to generate roadmap",
        );
      }
    };

    generate();
  }, [assessment, router]);

  if (!assessment) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="w-8 h-8 text-primary animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-16 max-w-2xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 text-center">
          <div className="flex justify-center items-center bg-primary/20 mx-auto mb-4 rounded-full w-16 h-16">
            {status === "generating" ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="w-8 h-8 text-primary animate-spin"
              />
            ) : status === "success" ? (
              <HugeiconsIcon
                icon={SparklesFreeIcons}
                className="w-8 h-8 text-primary"
              />
            ) : (
              <HugeiconsIcon icon={MapsIcon} className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "generating"
              ? "Generating Your Roadmap..."
              : status === "success"
                ? "Roadmap Ready!"
                : status === "error"
                  ? "Generation Failed"
                  : "Create Learning Roadmap"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          {status === "generating" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                AI is creating your personalized {assessment.targetRole}{" "}
                learning roadmap based on your skill gaps...
              </p>
              <div className="bg-muted mx-auto rounded-full w-48 h-2 overflow-hidden">
                <div className="bg-primary rounded-full w-1/2 h-full animate-pulse" />
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your roadmap has been created! Redirecting you now...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/assessment/${assessment.id}/results`)
                  }
                >
                  Back to Results
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
