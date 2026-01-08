"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadGapResources } from "@/lib/actions/load-gap-resources";
import { useState, useTransition } from "react";

interface GapResource {
  id: string;
  provider: string;
  url: string;
  title?: string | null;
  cost?: string | null;
  estimatedTime?: number | null;
}

interface GapCardProps {
  assessmentGapId: string;
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;

  impact: string;
  explanation: string;
  recommendedActions: string[];
  estimatedTimeWeeks: number;
  priority: number;
  evidence?: Array<{
    id: string;
    provider?: string | null;
    referenceUrl?: string | null;
    signals?: unknown;
    createdAt?: string;
  }>;
}

const getImpactColor = (impact: string) => {
  const k = (impact || "").toLowerCase();
  switch (k) {
    case "critical":
    case "high":
      return "bg-red-500/20 text-red-700 dark:text-red-300";
    case "medium":
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
    case "low":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
  }
  return "";
};

export function GapCard({
  assessmentGapId,
  skillId,
  skillName,
  currentLevel,
  targetLevel,

  impact,
  explanation,
  recommendedActions,
  estimatedTimeWeeks,
  evidence,
}: GapCardProps) {
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [resources, setResources] = useState<GapResource[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoadResources = () => {
    startTransition(async () => {
      const result = await loadGapResources({
        assessmentGapId,
        skillId,
        skillName,
        currentLevel,
        targetLevel,
      });

      if (result.success) {
        setResources(result.resources);
        setIsLoaded(true);
        setExpandedGap(skillName);
      }
    });
  };

  return (
    <Card className="bg-card overflow-hidden">
      <button
        onClick={() =>
          setExpandedGap(expandedGap === skillName ? null : skillName)
        }
        className="hover:bg-muted/50 p-6 w-full text-left transition-colors"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-foreground text-lg">
                {skillName}
              </h3>
              <Badge className={getImpactColor((impact || "").toLowerCase())}>
                {impact} impact
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Current: <strong>{currentLevel}/5</strong>
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">
                Target: <strong>{targetLevel}/5</strong>
              </span>
            </div>

            <p className="text-muted-foreground text-sm">{explanation}</p>
          </div>

          <svg
            className={`text-muted-foreground h-5 w-5 shrink-0 transition-transform ${
              expandedGap === skillName ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {expandedGap === skillName && (
        <div className="bg-muted/30 p-6 border-border border-t">
          {!isLoaded ? (
            <div className="py-6 text-center">
              <Button
                onClick={handleLoadResources}
                disabled={isPending}
                size="sm"
                variant="default"
              >
                {isPending
                  ? "Loading Resources..."
                  : "Load Recommended Resources"}
              </Button>
            </div>
          ) : (
            <>
              <h4 className="mb-3 font-medium text-foreground">
                Recommended Resources
              </h4>
              <div className="space-y-2">
                {resources && resources.length > 0 ? (
                  <>
                    {resources.map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {r.title || r.provider}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {r.provider} • {r.cost || "free/paid"} •{" "}
                            {r.estimatedTime || "—"} hrs
                          </p>
                        </div>
                        <div className="text-primary">Open</div>
                      </a>
                    ))}
                    <button
                      onClick={handleLoadResources}
                      disabled={isPending}
                      className="mt-4 text-muted-foreground hover:text-foreground text-sm underline"
                    >
                      {isPending ? "Regenerating..." : "Regenerate Resources"}
                    </button>
                  </>
                ) : (
                  <div className="py-4 text-muted-foreground text-sm text-center">
                    No resources found. Try again later.
                  </div>
                )}
              </div>

              {recommendedActions &&
                recommendedActions.length > 0 &&
                !resources.length && (
                  <>
                    <h5 className="mt-4 mb-3 font-medium text-foreground">
                      General Guidance
                    </h5>
                    <div className="space-y-2">
                      {recommendedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                        >
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {action}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Estimated: {estimatedTimeWeeks} weeks
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              {evidence && evidence.length > 0 && (
                <div className="mt-4">
                  <h5 className="mb-2 font-medium text-foreground">
                    Relevant Evidence
                  </h5>
                  <div className="space-y-2">
                    {evidence.map((ev) => (
                      <a
                        key={ev.id}
                        href={ev.referenceUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex justify-between items-center bg-background hover:bg-card p-3 border border-border rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {ev.provider || "Evidence"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {(ev.signals &&
                            typeof ev.signals === "object" &&
                            "summary" in ev.signals
                              ? (ev.signals as { summary: string }).summary
                              : null) || ev.referenceUrl}
                          </p>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          View
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
