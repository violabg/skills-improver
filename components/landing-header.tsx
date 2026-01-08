import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { SignOutButton } from "./auth/sign-out-button";
import { ThemeToggle } from "./theme-toggle";

export async function LandingHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="bg-card border-border border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
        <Link href="/">
          <div className="flex items-center gap-2">
            <div className="flex justify-center items-center bg-primary rounded-lg w-8 h-8 font-bold text-primary-foreground text-sm">
              SI
            </div>
            <span className="font-semibold text-foreground text-lg">
              Skills Improver
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-muted-foreground text-sm">
                {session.user.name || session.user.email}
              </span>
              <Link
                href="/dashboard"
                className={`${buttonVariants({
                  variant: "default",
                  size: "sm",
                })}`}
              >
                Dashboard
              </Link>

              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className={`${buttonVariants({
                variant: "outline",
                size: "sm",
              })}`}
            >
              Login
            </Link>
          )}
          <div className="flex-1 text-right">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
