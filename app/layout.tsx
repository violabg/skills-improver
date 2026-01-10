import { LandingHeader } from "@/components/landing-header";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skills Improver - AI-Powered Career Growth",
  description:
    "Discover skill gaps and get personalized growth plans powered by AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.98 0.005 210)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.12 0.015 240)" },
  ],
};

function HeaderSkeleton() {
  return (
    <header className="bg-card border-border border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="bg-muted rounded-lg w-8 h-8 animate-pulse" />
          <div className="bg-muted rounded w-32 h-6 animate-pulse" />
        </div>
        <div className="bg-muted rounded w-20 h-10 animate-pulse" />
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative bg-background min-h-screen overflow-hidden">
            {/* Background Gradients */}
            <div className="top-0 left-1/2 -z-10 absolute bg-primary/20 opacity-40 blur-[120px] rounded-full w-[1000px] h-[1000px] -translate-x-1/2 pointer-events-none" />
            <div className="right-0 bottom-0 -z-10 absolute bg-secondary/20 opacity-40 blur-[120px] rounded-full w-[800px] h-[800px] pointer-events-none" />

            {/* Header */}
            <Suspense fallback={<HeaderSkeleton />}>
              <LandingHeader />
            </Suspense>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
