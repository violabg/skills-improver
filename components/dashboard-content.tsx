import { SignOutButton } from "@/components/auth/sign-out-button";
import { AssessmentsList } from "@/components/dashboard/assessments-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
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

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-border border-b">
        <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8 font-bold text-primary-foreground text-sm">
              SI
            </div>
            <span className="font-semibold text-foreground text-lg">
              Skills Improver
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {session.user.name || session.user.email}
            </span>
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-bold text-foreground text-3xl">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's discover your skill gaps and create your growth plan
            </p>
          </div>

          {/* Assessment Options */}
          <div className="gap-6 grid md:grid-cols-3">
            {/* New Assessment Card */}
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
            <Card className="hover:shadow-lg transition-shadow">
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
          <Card>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
