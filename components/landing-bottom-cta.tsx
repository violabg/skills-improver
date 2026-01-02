import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function LandingBottomCTA() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-7xl text-center">
        <h2 className="mb-4 font-bold text-3xl">
          Ready to discover your skill gaps?
        </h2>
        <p className="opacity-90 mb-8 text-lg">
          Start your personalized assessment and get a 30-day growth plan
        </p>
        {session ? (
          <Link
            href="/assessment/start"
            className={`${buttonVariants({
              variant: "secondary",
              size: "lg",
            })}`}
          >
            Start Assessment
          </Link>
        ) : (
          <Link
            href="/login?redirect=/assessment/start"
            className={`${buttonVariants({
              variant: "secondary",
              size: "lg",
            })}`}
          >
            Sign in to begin
          </Link>
        )}
      </div>
    </section>
  );
}
