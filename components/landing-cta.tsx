import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function LandingCTA() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="pt-4">
      {session ? (
        <Link href="/assessment/start">
          <Button size="lg">Start Assessment</Button>
        </Link>
      ) : (
        <Link href="/login?redirect=/assessment/start">
          <Button size="lg">Start Skill Assessment (15-20 min)</Button>
        </Link>
      )}
    </div>
  );
}
