import { EvidenceUploadForm } from "@/components/assessment/evidence-upload-form";
import { PageShell } from "@/components/ui/page-shell";

export default function EvidencePage() {
  return (
    <PageShell
      currentStep={5}
      totalSteps={6}
      title="Add Evidence (Optional)"
      description="Connect your GitHub or upload your portfolio to help us understand your experience better. This step is completely optional."
      variant="default"
    >
      <EvidenceUploadForm />
    </PageShell>
  );
}
