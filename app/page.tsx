import { LandingBottomCTA } from "@/components/landing-bottom-cta";
import { LandingCTA } from "@/components/landing-cta";
import { LandingHeader } from "@/components/landing-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function HeaderSkeleton() {
  return (
    <header className="bg-card border-border border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded-lg w-8 h-8 animate-pulse" />
          <div className="bg-muted rounded w-32 h-6 animate-pulse" />
        </div>
        <div className="bg-muted rounded w-20 h-10 animate-pulse" />
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <Suspense fallback={<HeaderSkeleton />}>
        <LandingHeader />
      </Suspense>

      {/* Hero Section */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-7xl">
        <div className="space-y-12">
          {/* Main Headline */}
          <div className="space-y-6 text-center">
            <h1 className="font-bold text-foreground text-4xl sm:text-5xl tracking-tight">
              Discover what's holding your career back
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              AI-powered skill gap analysis for your next role. Hard skills +
              soft skills, no courses to sell.
            </p>

            {/* CTA */}
            <Suspense fallback={<div className="pt-4" />}>
              <LandingCTA />
            </Suspense>
          </div>

          {/* Trust Signals */}
          <div className="gap-4 grid md:grid-cols-3 pt-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-2 font-bold text-primary text-3xl">✓</div>
                <p className="font-medium text-foreground text-sm">
                  No courses to sell
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  We recommend external resources, not ours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-2 font-bold text-primary text-3xl">⏱️</div>
                <p className="font-medium text-foreground text-sm">
                  Takes ~20 minutes
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Quick assessment, deep insights
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-2 font-bold text-primary text-3xl">🎯</div>
                <p className="font-medium text-foreground text-sm">
                  Actionable results
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  30-day growth plan, not theory
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="font-bold text-foreground text-3xl">How it works</h2>
          </div>

          <div className="gap-8 grid md:grid-cols-4">
            {[
              {
                number: "1",
                title: "Profile Setup",
                description: "Tell us your current role and career goal",
              },
              {
                number: "2",
                title: "Self Assessment",
                description: "Rate your confidence in key skills",
              },
              {
                number: "3",
                title: "AI Evaluation",
                description: "AI tests your actual skill levels",
              },
              {
                number: "4",
                title: "Gap Report",
                description: "Get personalized growth recommendations",
              },
            ].map((step) => (
              <Card key={step.number}>
                <CardHeader>
                  <div className="flex justify-center items-center bg-primary/10 mb-3 rounded-full w-8 h-8 font-bold text-primary text-sm">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <Suspense fallback={<div className="bg-primary h-32" />}>
        <LandingBottomCTA />
      </Suspense>

      {/* Footer */}
      <footer className="bg-card border-border border-t">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl text-muted-foreground text-sm text-center">
          <p>© 2026 Skills Improver. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
