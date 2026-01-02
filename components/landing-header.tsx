import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function LandingHeader() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
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
          {session ? (
            <>
              <span className="text-slate-600 text-sm">
                {session.user.name || session.user.email}
              </span>
              <Link href="/dashboard">
                <Button variant="default" size="sm">
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
