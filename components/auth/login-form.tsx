"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleGitHubLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await signIn.social({
        provider: "github",
        callbackURL: redirectTo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  }, [redirectTo]);

  return (
    <Card>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Sign in to save progress & access your skill gap report
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 p-3 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* GitHub Login Button */}
        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 w-full h-10 text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚙️</span>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <GitHubIcon className="w-4 h-4" />
              Login with GitHub
            </span>
          )}
        </Button>

        {/* Privacy Notice */}
        <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-xs leading-relaxed">
            <strong>Privacy & Data:</strong> We only store minimal profile
            information from GitHub. Evidence uploads require explicit consent.
            No courses or content is hosted on our platform.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c2.6-.3 5.4-1.3 5.4-6a4.7 4.7 0 0 0-1.3-3.2 4.4 4.4 0 0 0-.1-3.2s-1.1-.3-3.6 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.4 4.4 0 0 0-.1 3.2A4.7 4.7 0 0 0 4 9.5c0 4.6 2.7 5.7 5.4 6-.5.5-.9 1.2-1 2v4" />
      <path d="M9 18c-4.51 2-5-2.5-7-3" />
    </svg>
  );
}
