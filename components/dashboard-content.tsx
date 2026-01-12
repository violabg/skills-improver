import { AssessmentsList } from "@/components/dashboard/assessments-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
    <div className="bg-transparent min-h-screen">
      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-bold text-foreground text-3xl">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-lg">
              Let&apos;s discover your skill gaps and create your growth plan
            </p>
          </div>

          {/* Assessment Options */}
          <div className="gap-6 grid md:grid-cols-3">
            {/* New Assessment Card */}
            <Card className="bg-card/60 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Start New Assessment</CardTitle>
                <CardDescription>
                  Evaluate your skills for a career goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  Get AI-powered evaluation of your hard and soft skills against
                  a target role. Takes about 20 minutes.
                </p>
                <Link href="/assessment/start">
                  <Button className="w-full">Begin Assessment</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Skills Graph Card */}
            <Card className="bg-card/60 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Skills Knowledge Graph</CardTitle>
                <CardDescription>Explore skill relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  Interactive visualization of how skills connect and depend on
                  each other.
                </p>
                <Link href="/skills">
                  <Button variant="outline" className="w-full">
                    View Graph
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Previous Assessments Info Card */}
            <Card className="bg-card/60 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Your Assessments</CardTitle>
                <CardDescription>
                  View past results and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground text-sm">
                  Review your skill gap reports, track improvements, and revisit
                  your growth plans below.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Saved Assessments Section */}
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-foreground text-xl">
                Your Assessment History
              </h2>
              <p className="text-muted-foreground text-sm">
                View and manage your skill assessments
              </p>
            </div>
            <Suspense
              fallback={
                <Card className="bg-muted/50">
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="bg-slate-200 rounded w-32 h-6 animate-pulse" />
                      <div className="bg-slate-200 rounded w-48 h-4 animate-pulse" />
                    </div>
                  </CardHeader>
                </Card>
              }
            >
              <AssessmentsList />
            </Suspense>
          </div>

          {/* Profile Card */}
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground text-sm">Email</p>
                  <p className="text-muted-foreground text-sm">
                    {session.user.email}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Name</p>
                  <p className="text-muted-foreground text-sm">
                    {session.user.name || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    CV / Resume
                  </p>
                  {user?.cvUrl ? (
                    <a
                      href={user.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
                    >
                      View uploaded CV
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not uploaded
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
