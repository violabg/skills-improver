import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <LoginForm />

      {/* Features Preview */}
      <div className="space-y-3 pt-4">
        <h3 className="font-semibold text-foreground text-sm">
          What you&apos;ll get:
        </h3>
        <ul className="space-y-2 text-muted-foreground text-sm">
          <li className="flex gap-3">
            <CheckIcon className="mt-0.5 w-5 h-5 text-green-600 shrink-0" />
            <span>AI-powered skill gap analysis</span>
          </li>
          <li className="flex gap-3">
            <CheckIcon className="mt-0.5 w-5 h-5 text-green-600 shrink-0" />
            <span>Hard + soft skill assessment</span>
          </li>
          <li className="flex gap-3">
            <CheckIcon className="mt-0.5 w-5 h-5 text-green-600 shrink-0" />
            <span>30-day actionable growth plan</span>
          </li>
          <li className="flex gap-3">
            <CheckIcon className="mt-0.5 w-5 h-5 text-green-600 shrink-0" />
            <span>Personalized resource recommendations</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
