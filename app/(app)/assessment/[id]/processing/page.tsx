import { ProcessingContent } from "@/components/assessment/processing-content";
import { PageShell } from "@/components/ui/page-shell";

export default function ProcessingPage() {
  return (
    <PageShell
      currentStep={6}
      totalSteps={7}
      title="Processing Your Assessment"
      description="AI is analyzing your responses. This usually takes a few moments."
      variant="wide"
      className="flex justify-center items-center min-h-[50vh]"
    >
      <ProcessingContent />
    </PageShell>
  );
}
