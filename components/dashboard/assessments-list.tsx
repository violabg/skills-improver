"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc/client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Assessment {
  id: string;
  targetRole: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  results: Array<{
    id: string;
    level: number;
    confidence: number;
    skill: {
      name: string;
      category: string;
    };
  }>;
}

export function AssessmentsList() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        const data = await client.assessment.list();
        console.log("Loaded assessments:", data);
        setAssessments(data as Assessment[]);
        setError(null);
      } catch (err) {
        console.error("Failed to load assessments:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load assessments"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-48 h-4" />
                </div>
                <Skeleton className="w-16 h-6" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-24 h-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>No Assessments Yet</CardTitle>
          <CardDescription>
            Start your first assessment to see results here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/assessment/start">
            <Button>Start Your First Assessment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REVIEW_PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "REVIEW_PENDING":
        return "Review Pending";
      case "COMPLETED":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => (
        <Card key={assessment.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">
                    {assessment.targetRole || "Assessment"}
                  </CardTitle>
                  <Badge className={getStatusColor(assessment.status)}>
                    {getStatusText(assessment.status)}
                  </Badge>
                </div>
                <CardDescription>
                  {assessment.completedAt
                    ? `Completed ${new Date(
                        assessment.completedAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : `Started ${new Date(
                        assessment.startedAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Results Summary */}
            {assessment.results.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="mb-2 font-medium text-foreground text-sm">
                  Skills Evaluated: {assessment.results.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Map(
                      assessment.results.map((r) => [r.skill.name, r.skill])
                    ).values()
                  )
                    .slice(0, 5)
                    .map((skill) => (
                      <Badge key={skill.name} variant="outline">
                        {skill.name}
                      </Badge>
                    ))}
                  {assessment.results.length > 5 && (
                    <Badge variant="outline">
                      +{assessment.results.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {assessment.status === "COMPLETED" ? (
                <Link
                  href={`/assessment/${assessment.id}/results`}
                  className={`${buttonVariants({
                    variant: "default",
                  })} flex-1 w-full`}
                >
                  View Results
                </Link>
              ) : (
                <>
                  <Link
                    href={`/assessment/${assessment.id}/test`}
                    className={`${buttonVariants({
                      variant: "default",
                    })} flex-1 w-full`}
                  >
                    Continue Assessment
                  </Link>
                  <Button variant="outline" className="flex-1" disabled>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
