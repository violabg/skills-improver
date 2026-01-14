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
    <Card className="relative bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-xl border-border/50 w-full max-w-md overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="top-0 right-0 absolute bg-primary/10 opacity-50 blur-3xl -mt-20 -mr-20 rounded-full w-64 h-64 pointer-events-none" />

      <CardHeader className="space-y-3 pt-10 pb-8 text-center">
        <div className="flex justify-center items-center bg-primary/10 mx-auto mb-2 rounded-2xl w-16 h-16 text-3xl">
          🚀
        </div>
        <CardTitle className="font-bold text-3xl tracking-tight">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-base">
          Sign in to access your personalized growth roadmap
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-8 pb-10">
        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 bg-destructive/10 p-4 border border-destructive/20 rounded-xl">
            <div className="mt-0.5 text-destructive">⚠️</div>
            <p className="font-medium text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* GitHub Login Button */}
        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          size="lg"
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 w-full h-12 font-semibold text-base transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <GitHubIcon className="w-5 h-5" />
              Continue with GitHub
            </span>
          )}
        </Button>

        {/* Privacy Notice */}
        <div className="space-y-4 pt-2 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="border-t w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Secure Authentication
              </span>
            </div>
          </div>
          <p className="mx-auto max-w-xs text-muted-foreground text-xs leading-relaxed">
            By signing in, you agree to our Terms of Service. We only access
            your public GitHub profile info.
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
