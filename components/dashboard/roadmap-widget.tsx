"use client";

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
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/orpc/client";
import {
  CheckmarkCircle01Icon,
  MapsIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RoadmapProgress {
  id: string;
  title: string;
  totalWeeks: number;
  progress: {
    total: number;
    completed: number;
  };
  targetRole?: string | null;
}

export function RoadmapWidget() {
  const [roadmap, setRoadmap] = useState<RoadmapProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        // Using active roadmap
        const data = await client.roadmap.getActive();
        if (data) {
          setRoadmap({
            id: data.id,
            title: data.title,
            totalWeeks: data.totalWeeks,
            targetRole: data.assessment.targetRole,
            progress: {
              total: data.milestones.length,
              completed: data.milestones.filter((m) => m.status === "COMPLETED")
                .length,
            },
          });
        }
      } catch (err) {
        console.error("Failed to load roadmap progress:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="w-48 h-5" />
          <Skeleton className="w-32 h-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-2" />
          <Skeleton className="w-full h-10" />
        </CardContent>
      </Card>
    );
  }

  if (!roadmap) {
    return (
      <Card className="bg-primary/5 shadow-sm border-primary/10 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={MapsIcon} className="w-5 h-5 text-primary" />
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
            <HugeiconsIcon icon={PlayIcon} className="mr-2 w-4 h-4" />
            Start Assessment
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const percentage = Math.round(
    (roadmap.progress.completed / roadmap.progress.total) * 100,
  );

  return (
    <Card className="group relative shadow-sm hover:border-primary/40 overflow-hidden transition-all">
      <div className="top-0 right-0 absolute bg-primary/5 group-hover:bg-primary/10 blur-xl -mt-4 -mr-4 rounded-full w-20 h-20 transition-all" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HugeiconsIcon icon={MapsIcon} className="w-5 h-5 text-primary" />
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
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            className="w-4 h-4 text-green-500"
          />
          <span>
            {roadmap.progress.completed} of {roadmap.progress.total} milestones
            mastered
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
