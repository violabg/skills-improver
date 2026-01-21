import { AssessmentsList } from "@/components/dashboard/assessments-list";
import { RoadmapWidget } from "@/components/dashboard/roadmap-widget";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Fetch user's CV information
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { cvUrl: true },
  });

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex md:flex-row flex-col justify-between md:items-end gap-4 pb-6 border-border/40 border-b">
            <div className="space-y-1">
              <h1 className="bg-clip-text bg-gradient-to-r from-primary to-blue-600 pb-1 font-bold text-transparent text-3xl sm:text-4xl tracking-tight">
                Dashboard
              </h1>
              <p className="max-w-2xl text-muted-foreground text-lg">
                Track your career growth, identify skill gaps, and master your
                path to Senior Engineer.
              </p>
            </div>
            <Link
              href="/assessment/start"
              className={`${buttonVariants({ variant: "default", size: "lg" })} shadow-lg shadow-primary/20 hover:shadow-primary/30 px-8 rounded-full transition-all`}
            >
              Start New Assessment
            </Link>
          </div>

          <div className="gap-6 grid grid-cols-1 lg:grid-cols-12">
            {/* Main Content Column */}
            <div className="space-y-8 lg:col-span-8">
              {/* Featured Card */}
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                <Card className="group relative bg-gradient-to-br from-card to-muted/50 hover:border-primary/50 overflow-hidden transition-all">
                  <div className="top-0 right-0 absolute bg-primary/10 group-hover:bg-primary/20 blur-2xl -mt-4 -mr-4 rounded-full w-24 h-24 transition-all" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary/10 p-2 rounded-lg text-primary">
                        🎯
                      </span>
                      Career Goal
                    </CardTitle>
                    <CardDescription>
                      Set your target role and requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Define where you want to go. AI will analyze the gap
                      between your current skills and your dream role.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/assessment/start"
                      className={`${buttonVariants({ variant: "outline" })} group-hover:border-primary/50 w-full`}
                    >
                      Set Goal
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="group relative bg-gradient-to-br from-card to-muted/50 hover:border-primary/50 overflow-hidden transition-all">
                  <div className="top-0 right-0 absolute bg-blue-500/10 group-hover:bg-blue-500/20 blur-2xl -mt-4 -mr-4 rounded-full w-24 h-24 transition-all" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                        🧬
                      </span>
                      Skill Graph
                    </CardTitle>
                    <CardDescription>Visualize your knowledge</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Explore the interactive map of 15 core frontend skills and
                      see how they connect.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/skills"
                      className={`${buttonVariants({ variant: "outline" })} group-hover:border-blue-500/50 w-full`}
                    >
                      View Graph
                    </Link>
                  </CardFooter>
                </Card>

                <Card className="group relative bg-gradient-to-br from-card to-muted/50 hover:border-primary/50 overflow-hidden transition-all">
                  <div className="top-0 right-0 absolute bg-emerald-500/10 group-hover:bg-emerald-500/20 blur-2xl -mt-4 -mr-4 rounded-full w-24 h-24 transition-all" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        🤖
                      </span>
                      AI Career Advisor
                    </CardTitle>
                    <CardDescription>Get personalized guidance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Chat with your AI coach to discuss your career path,
                      analyze gaps, and get instant feedback.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href="/chat"
                      className={`${buttonVariants({ variant: "outline" })} group-hover:border-emerald-500/50 w-full`}
                    >
                      Start Chat
                    </Link>
                  </CardFooter>
                </Card>
              </div>

              {/* Assessment History */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-xl tracking-tight">
                    Recent Activity
                  </h2>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-primary text-sm transition-colors"
                  >
                    View all history →
                  </Link>
                </div>
                <Suspense
                  fallback={
                    <div className="space-y-4 bg-card/50 p-8 border border-border/50 rounded-xl text-center">
                      <div className="bg-muted mx-auto rounded w-3/4 h-4 animate-pulse" />
                      <div className="bg-muted mx-auto rounded w-1/2 h-4 animate-pulse" />
                    </div>
                  }
                >
                  <AssessmentsList />
                </Suspense>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6 lg:col-span-4">
              {/* Roadmap Widget */}
              <RoadmapWidget />

              {/* Profile Card */}
              <Card className="shadow-sm border-border/60">
                <CardHeader className="bg-muted/20 pb-3 border-border/40 border-b">
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center items-center bg-primary/10 rounded-full w-10 h-10 font-bold text-primary">
                      {session.user.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {session.user.name || "User"}
                      </CardTitle>
                      <CardDescription className="max-w-[200px] text-xs truncate">
                        {session.user.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">CV / Resume</span>
                      {user?.cvUrl ? (
                        <span className="bg-green-500/10 px-2 py-0.5 rounded-full text-green-600 dark:text-green-400 text-xs">
                          Uploaded
                        </span>
                      ) : (
                        <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground text-xs">
                          Missing
                        </span>
                      )}
                    </div>
                    {user?.cvUrl ? (
                      <a
                        href={user.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary text-xs transition-colors"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Document
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Upload your CV to get better recommendations.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Resources / Tips */}
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader>
                  <CardTitle className="font-medium text-primary text-sm">
                    💡 Pro Tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 text-sm">
                    Regular assessments help track your progress. Try to
                    evaluate your skills every month to keep your growth plan up
                    to date.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
