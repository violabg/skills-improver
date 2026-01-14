import { LandingBottomCTA } from "@/components/landing-bottom-cta";
import { LandingCTA } from "@/components/landing-cta";
import { Suspense } from "react";

export default function LandingPage() {
  return (
    <div className="relative bg-background selection:bg-primary/20 min-h-screen overflow-hidden text-foreground">
      {/* Background Ambience */}
      <div className="-z-10 fixed inset-0 pointer-events-none">
        <div className="-top-[20%] -left-[10%] absolute bg-primary/5 opacity-50 blur-3xl rounded-full w-[50%] h-[50%]" />
        <div className="top-[20%] right-[0%] absolute bg-blue-500/5 opacity-30 blur-3xl rounded-full w-[40%] h-[40%]" />
        <div className="bottom-0 left-1/3 absolute bg-purple-500/5 opacity-30 blur-3xl rounded-full w-[60%] h-[40%]" />
      </div>

      {/* Hero Section */}
      <section className="z-10 relative mx-auto px-4 pt-32 md:pt-48 pb-16 md:pb-32 max-w-5xl text-center">
        <div className="inline-flex slide-in-from-bottom-4 justify-center items-center bg-primary/5 mb-8 px-4 py-1.5 border border-primary/20 rounded-full font-medium text-primary text-sm animate-in duration-500 fade-in">
          🚀 Career Growth Platform
        </div>

        <h1 className="slide-in-from-bottom-6 mb-8 font-black text-5xl md:text-7xl leading-[1.1] tracking-tighter animate-in duration-700 fade-in">
          Discover what's <br className="hidden sm:block" />
          <span className="bg-clip-text bg-gradient-to-r from-primary to-blue-600 text-transparent">
            holding you back
          </span>
        </h1>

        <p className="slide-in-from-bottom-8 mx-auto mb-12 max-w-2xl text-muted-foreground text-xl md:text-2xl leading-relaxed animate-in duration-700 delay-100 fade-in">
          AI-powered skill gap analysis for frontend developers. Identify the
          missing pieces between you and your next senior role.
        </p>

        <div className="slide-in-from-bottom-10 flex sm:flex-row flex-col justify-center items-center gap-4 animate-in duration-700 delay-200 fade-in">
          <Suspense
            fallback={
              <div className="bg-muted rounded-full w-48 h-12 animate-pulse" />
            }
          >
            <LandingCTA />
          </Suspense>
          <div className="flex items-center gap-2 mt-4 sm:mt-0 text-muted-foreground text-sm">
            <span className="inline-block bg-green-500 rounded-full w-2 h-2" />
            Fast, free, and accurate
          </div>
        </div>
      </section>

      {/* Value Props / BENTO GRID */}
      <section className="mx-auto mb-32 px-4 max-w-6xl">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
          {/* Card 1 */}
          <div className="group relative bg-card hover:shadow-2xl hover:shadow-primary/5 p-8 border border-border/50 rounded-3xl overflow-hidden transition-all duration-300">
            <div className="top-0 right-0 absolute bg-primary/10 opacity-50 group-hover:opacity-100 blur-2xl -mt-16 -mr-16 rounded-full w-32 h-32 transition-opacity" />
            <div className="z-10 relative">
              <div className="flex justify-center items-center bg-primary/10 mb-6 rounded-2xl w-12 h-12 text-primary text-2xl">
                🚫
              </div>
              <h3 className="mb-3 font-bold text-xl">No Courses to Sell</h3>
              <p className="text-muted-foreground leading-relaxed">
                We are an impartial analysis tool. We recommend the best
                external resources (mostly free) to fill your specific gaps.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-card hover:shadow-2xl hover:shadow-blue-500/5 p-8 border border-border/50 rounded-3xl overflow-hidden transition-all duration-300">
            <div className="top-0 right-0 absolute bg-blue-500/10 opacity-50 group-hover:opacity-100 blur-2xl -mt-16 -mr-16 rounded-full w-32 h-32 transition-opacity" />
            <div className="z-10 relative">
              <div className="flex justify-center items-center bg-blue-500/10 mb-6 rounded-2xl w-12 h-12 text-blue-500 text-2xl">
                ⚡️
              </div>
              <h3 className="mb-3 font-bold text-xl">20 Minute Checkup</h3>
              <p className="text-muted-foreground leading-relaxed">
                Quick assessment, deep insights. Don't waste hours on generic
                tests. Get straight to the data that matters.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-card hover:shadow-2xl hover:shadow-purple-500/5 p-8 border border-border/50 rounded-3xl overflow-hidden transition-all duration-300">
            <div className="top-0 right-0 absolute bg-purple-500/10 opacity-50 group-hover:opacity-100 blur-2xl -mt-16 -mr-16 rounded-full w-32 h-32 transition-opacity" />
            <div className="z-10 relative">
              <div className="flex justify-center items-center bg-purple-500/10 mb-6 rounded-2xl w-12 h-12 text-purple-500 text-2xl">
                🎯
              </div>
              <h3 className="mb-3 font-bold text-xl">Actionable Roadmap</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive a prioritized list of what to learn next. A clear 30-day
                plan to level up your skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="relative bg-muted/20 py-24 border-border/50 border-y">
        <div className="mx-auto px-4 max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl">How it works</h2>
            <p className="text-muted-foreground text-lg">
              Your path to promotion in 4 steps
            </p>
          </div>

          <div className="gap-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Profile", desc: "Set your target role" },
              { step: "02", title: "Evaluate", desc: "Rate your confidence" },
              { step: "03", title: "Test", desc: "Verify with AI" },
              { step: "04", title: "Grow", desc: "Get your plan" },
            ].map((s, i) => (
              <div
                key={i}
                className="relative bg-background shadow-sm p-6 border border-border/50 rounded-2xl"
              >
                <div className="top-4 right-4 absolute font-black text-muted/20 text-6xl pointer-events-none">
                  {s.step}
                </div>
                <div className="z-10 relative pt-4">
                  <h3 className="mb-2 font-bold text-lg">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-24 text-center">
        <div className="relative bg-gradient-to-br from-primary/5 to-blue-500/5 mx-auto p-12 border border-primary/10 rounded-[3rem] max-w-3xl overflow-hidden">
          {/* Decorative */}
          {/* <div className="top-0 left-1/2 absolute bg-grid-white/5 w-full h-full -translate-x-1/2 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" /> */}

          <div className="z-10 relative">
            <h2 className="mb-6 font-bold text-3xl md:text-4xl tracking-tight">
              Ready to close the gap?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground text-lg">
              Stop guessing what you need to learn. Let data guide your career
              growth.
            </p>
            <Suspense
              fallback={
                <div className="bg-muted mx-auto rounded-full w-48 h-12" />
              }
            >
              <LandingBottomCTA />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-border/40 border-t text-muted-foreground text-sm text-center">
        <div className="flex flex-col items-center gap-4 mx-auto px-4 max-w-7xl">
          <div className="flex justify-center items-center bg-primary/10 rounded-xl w-10 h-10 text-lg">
            🚀
          </div>
          <p>© 2026 Skills Improver. Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
}
