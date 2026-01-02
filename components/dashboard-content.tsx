import { SignOutButton } from "@/components/auth/sign-out-button";
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

export async function DashboardContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <header className="bg-white border-slate-200 border-b">
        <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-blue-600 rounded-lg w-8 h-8 font-bold text-white text-sm">
              SI
            </div>
            <span className="font-semibold text-slate-900 text-lg">
              Skills Improver
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm">
              {session.user.name || session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-bold text-slate-900 text-3xl">Welcome back!</h1>
            <p className="text-slate-600 text-lg">
              Let's discover your skill gaps and create your growth plan
            </p>
          </div>

          {/* Assessment Options */}
          <div className="gap-6 grid md:grid-cols-2">
            {/* New Assessment Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Start New Assessment</CardTitle>
                <CardDescription>
                  Evaluate your skills for a career goal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-slate-600 text-sm">
                  Get AI-powered evaluation of your hard and soft skills against
                  a target role. Takes about 20 minutes.
                </p>
                <Link href="/assessment/start">
                  <Button className="w-full">Begin Assessment</Button>
                </Link>
              </CardContent>
            </Card>

            {/* View Assessments Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Your Assessments</CardTitle>
                <CardDescription>
                  View past results and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-slate-600 text-sm">
                  Review your skill gap reports, track improvements, and revisit
                  your growth plans.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  View Results (Coming soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-slate-900 text-sm">Email</p>
                  <p className="text-slate-600 text-sm">{session.user.email}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Name</p>
                  <p className="text-slate-600 text-sm">
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
