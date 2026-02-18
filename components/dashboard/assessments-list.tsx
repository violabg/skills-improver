import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/data/dashboard";
import Link from "next/link";

interface AssessmentsListProps {
  assessments: DashboardData["recentAssessments"];
}

export function AssessmentsList({ assessments }: AssessmentsListProps) {
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
          <Link
            href="/assessment/start"
            className={`${buttonVariants({ variant: "default" })}`}
          >
            Start Your First Assessment
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "REVIEW_PENDING":
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      default:
        return "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20";
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
    <div className="space-y-3">
      {assessments.map((assessment) => (
        <div
          key={assessment.id}
          className="group flex sm:flex-row flex-col justify-between sm:items-center gap-4 bg-card hover:bg-muted/50 hover:shadow-sm p-4 border border-border/50 hover:border-primary/20 rounded-xl transition-all"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-base truncate">
                {assessment.targetRole || "Untitled Assessment"}
              </h3>
              <Badge
                variant="outline"
                className={`border ${getStatusColor(assessment.status)}`}
              >
                {getStatusText(assessment.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {assessment.completedAt
                  ? new Date(assessment.completedAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : new Date(assessment.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
              </span>
              {assessment.resultsCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {assessment.resultsCount} skills evaluated
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center sm:self-center gap-3 pt-2 sm:pt-0 border-border/50 border-t sm:border-t-0 transition-opacity">
            {assessment.status === "COMPLETED" ? (
              <Link
                href={`/assessment/${assessment.id}/results`}
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "w-full sm:w-auto font-medium",
                })}
              >
                View Results
              </Link>
            ) : (
              <Link
                href={`/assessment/${assessment.id}/test`}
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "w-full sm:w-auto",
                })}
              >
                Continue
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
