import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/data/dashboard";
import { CheckCircle, Map, Play } from "lucide-react";
import Link from "next/link";

interface RoadmapWidgetProps {
  roadmap: DashboardData["activeRoadmap"];
}

export function RoadmapWidget({ roadmap }: RoadmapWidgetProps) {
  if (!roadmap) {
    return (
      <Card className="bg-primary/5 shadow-sm border-primary/10 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="w-5 h-5 text-primary" />
            Learning Roadmap
          </CardTitle>
          <CardDescription>
            You don&apos;t have an active roadmap yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Complete an assessment to generate a personalized learning path to
            your goal.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/assessment/start"
            className={`${buttonVariants({ variant: "outline", size: "sm" })} w-full`}
          >
            <Play className="mr-2 w-4 h-4" />
            Start Assessment
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const totalMilestones = roadmap.milestones.length;
  const completedMilestones = roadmap.milestones.filter(
    (milestone) => milestone.status === "COMPLETED",
  ).length;

  const percentage = Math.round(
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
  );

  return (
    <Card className="group relative shadow-sm hover:border-primary/40 overflow-hidden transition-all">
      <div className="top-0 right-0 absolute bg-primary/5 group-hover:bg-primary/10 blur-xl -mt-4 -mr-4 rounded-full w-20 h-20 transition-all" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Map className="w-5 h-5 text-primary" />
          Active Roadmap
        </CardTitle>
        <CardDescription className="font-medium text-foreground">
          {roadmap.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium text-muted-foreground text-sm">
              Total Progress
            </span>
            <span className="font-bold text-primary text-sm">
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>
            {completedMilestones} of {totalMilestones} milestones mastered
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href="/roadmap"
          className={`${buttonVariants({ variant: "default", size: "sm" })} w-full shadow-sm`}
        >
          Open Roadmap
        </Link>
      </CardFooter>
    </Card>
  );
}
