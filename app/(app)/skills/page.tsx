import { SkillGraph } from "@/components/dashboard/skill-graph";
import { SkillGraphSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getSkillGraph } from "@/lib/data/get-skills";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Server component that fetches cached skill data
async function SkillGraphLoader() {
  const skills = await getSkillGraph();
  return <SkillGraph skills={skills} />;
}

export default async function SkillsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto pt-8 pb-12 max-w-7xl">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 pb-6 border-border/40 border-b">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
              <h1 className="bg-clip-text bg-gradient-to-r from-primary to-blue-600 pb-1 font-bold text-transparent text-3xl sm:text-4xl tracking-tight">
                Skills Knowledge Graph
              </h1>
              <p className="max-w-2xl text-muted-foreground text-lg">
                Interactive visualization of skill dependencies. See how
                mastering one skill unlocks others.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-blue-500/10 px-3 border-blue-200 dark:border-blue-900 h-8 text-blue-600"
              >
                Hard Skills
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-500/10 px-3 border-green-200 dark:border-green-900 h-8 text-green-600"
              >
                Soft Skills
              </Badge>
              <Badge
                variant="outline"
                className="bg-purple-500/10 px-3 border-purple-200 dark:border-purple-900 h-8 text-purple-600"
              >
                Meta Skills
              </Badge>
            </div>
          </div>

          <div className="gap-6 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-16rem)] min-h-[600px]">
            <div className="lg:col-span-12 h-full">
              <Suspense fallback={<SkillGraphSkeleton />}>
                <SkillGraphLoader />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
