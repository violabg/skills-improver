"use client";

import type { Assessment } from "@/lib/prisma/client";
import React from "react";

const AssessmentContext = React.createContext<{
  assessment: Assessment | null;
}>({
  assessment: null,
});

export function AssessmentProvider({
  assessment,
  children,
}: {
  assessment: Assessment;
  children: React.ReactNode;
}) {
  return (
    <AssessmentContext.Provider value={{ assessment }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = React.useContext(AssessmentContext);
  if (!context.assessment) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return context.assessment;
}
