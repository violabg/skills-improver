import { LandingBottomCTA } from "@/components/landing-bottom-cta";
import { LandingCTA } from "@/components/landing-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-7xl">
        <div className="space-y-12">
          {/* Main Headline */}
          <div className="space-y-6 text-center">
            <h1 className="bg-clip-text bg-linear-to-r from-foreground to-foreground/70 font-bold text-transparent text-5xl sm:text-7xl tracking-tight">
              Discover what&apos;s holding your career back
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
            <Card className="bg-card/50 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center items-center bg-primary/10 mx-auto mb-4 p-3 rounded-full w-16 h-16 font-bold text-primary text-3xl">
                  ✓
                </div>
                <p className="font-medium text-foreground text-lg">
                  No courses to sell
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  We recommend external resources, not ours
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center items-center bg-primary/10 mx-auto mb-4 p-3 rounded-full w-16 h-16 font-bold text-primary text-3xl">
                  ⏱️
                </div>
                <p className="font-medium text-foreground text-lg">
                  Takes ~20 minutes
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Quick assessment, deep insights
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 hover:shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center items-center bg-primary/10 mx-auto mb-4 p-3 rounded-full w-16 h-16 font-bold text-primary text-3xl">
                  🎯
                </div>
                <p className="font-medium text-foreground text-lg">
                  Actionable results
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
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
              <Card
                key={step.number}
                className="relative bg-card/50 hover:shadow-lg backdrop-blur-sm overflow-hidden transition-all hover:-translate-y-1"
              >
                <div className="top-0 right-0 absolute bg-primary/5 rounded-bl-full w-24 h-24" />
                <CardHeader>
                  <div className="flex justify-center items-center bg-primary shadow-lg mb-3 rounded-2xl w-10 h-10 font-bold text-primary-foreground text-sm">
                    {step.number}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-base leading-relaxed">
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
    </>
  );
}
