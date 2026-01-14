import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function LandingBottomCTA() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session ? (
    <Link
      href="/assessment/start"
      className={buttonVariants({
        size: "lg",
        className:
          "h-12 px-8 text-base shadow-lg shadow-primary/25 rounded-full",
      })}
    >
      Start Assessment
    </Link>
  ) : (
    <Link
      href="/login?redirect=/assessment/start"
      className={buttonVariants({
        size: "lg",
        className:
          "h-12 px-8 text-base shadow-lg shadow-primary/25 rounded-full",
      })}
    >
      Sign in to begin
    </Link>
  );
}
