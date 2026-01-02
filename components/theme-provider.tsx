"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { Suspense } from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <Suspense fallback={<div className="w-svw h-svh"></div>}>
        {children}
      </Suspense>
    </NextThemesProvider>
  );
}
