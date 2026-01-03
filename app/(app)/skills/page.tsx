import { SkillGraph } from "@/components/dashboard/skill-graph";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

async function fetchSkillGraph() {
  const skills = await db.skill.findMany({
    include: {
      fromRelations: {
        include: {
          toSkill: true,
        },
      },
    },
  });

  return skills;
}

export default async function SkillsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const skills = await fetchSkillGraph();

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-border border-b">
        <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })}`}
            >
              ← Back
            </Link>
            <h1 className="font-bold text-foreground text-2xl">
              Skills Knowledge Graph
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Explore the relationships between skills. Arrows show dependencies
              (e.g., TypeScript requires JavaScript). Use the filter to focus on
              specific skill categories.
            </p>
          </div>

          <SkillGraph skills={skills} />

          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="mb-2 font-medium text-foreground">Legend</h3>
            <div className="gap-4 grid sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500 rounded w-4 h-4" />
                <span className="text-muted-foreground text-sm">
                  Hard Skills (Technical)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-500 rounded w-4 h-4" />
                <span className="text-muted-foreground text-sm">
                  Soft Skills (People)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-purple-500 rounded w-4 h-4" />
                <span className="text-muted-foreground text-sm">
                  Meta Skills (Learning)
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
