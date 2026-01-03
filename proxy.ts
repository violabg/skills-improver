import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const { pathname } = request.nextUrl;

  // Root path handling: allow access to landing page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Protected routes: redirect to login if not authenticated
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/assessment") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/skills");

  if (isProtectedRoute && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth routes: redirect to dashboard if already authenticated
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
