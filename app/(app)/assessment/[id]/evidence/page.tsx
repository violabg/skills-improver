"use client";

import { EvidenceUploadForm } from "@/components/assessment/evidence-upload-form";
import { PageShell } from "@/components/ui/page-shell";

export default function EvidencePage() {
  return (
    <PageShell variant="default">
      <div className="space-y-2 mb-8">
        <div className="text-muted-foreground text-sm">Step 5 of 7</div>
        <h1 className="font-bold text-foreground text-3xl">
          Add Evidence (Optional)
        </h1>
        <p className="text-muted-foreground">
          Connect your GitHub or upload your portfolio to help us understand
          your experience better. This step is completely optional.
        </p>
      </div>

      <EvidenceUploadForm />
    </PageShell>
  );
}
