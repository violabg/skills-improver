"use client";

import {
  ResultsContent,
  type GapsData,
} from "@/components/assessment/results-content";
import { PageShell } from "@/components/ui/page-shell";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { useEffect, useState } from "react";

export default function ResultsPage() {
  const assessment = useAssessment();
  const [gapsData, setGapsData] = useState<GapsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        // Call server action to fetch/compute results
        const response = await fetch(
          `/api/assessment/${assessment.id}/results`
        );
        if (!response.ok) {
          throw new Error("Failed to load results");
        }
        const data = await response.json();
        setGapsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [assessment.id]);

  if (loading) {
    return (
      <PageShell variant="default">
        <div className="space-y-4">
          <div className="bg-muted rounded w-32 h-8 animate-pulse" />
          <div className="bg-muted rounded w-64 h-12 animate-pulse" />
          <div className="bg-muted rounded h-96 animate-pulse" />
        </div>
      </PageShell>
    );
  }

  if (error || !gapsData) {
    return (
      <PageShell variant="default">
        <div className="space-y-4 text-center">
          <p className="text-red-600">{error || "Failed to load results"}</p>
          <a href="/assessment/start" className="text-primary hover:underline">
            Start New Assessment
          </a>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell variant="default">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 7 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Your Skill Gap Report
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your personalized skill analysis and recommended learning
          path
        </p>
      </div>
      <ResultsContent gapsData={gapsData} />
    </PageShell>
  );
}
