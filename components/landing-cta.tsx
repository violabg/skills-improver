import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function LandingCTA() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div>
      {session ? (
        <Link
          href="/assessment/start"
          className={`${buttonVariants({
            size: "lg",
          })}`}
        >
          Start Assessment
        </Link>
      ) : (
        <Link
          href="/login?redirect=/assessment/start"
          className={`${buttonVariants({
            size: "lg",
          })}`}
        >
          Start Skill Assessment (15-20 min)
        </Link>
      )}
    </div>
  );
}
