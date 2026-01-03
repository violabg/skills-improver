"use client";

import { FileUploadField, InputField } from "@/components/rhf-inputs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const EvidenceUploadSchema = z.object({
  portfolioUrl: z.string(),
});

type EvidenceUploadData = z.infer<typeof EvidenceUploadSchema>;

interface EvidenceUploadFormProps {
  assessmentId: string;
}

export function EvidenceUploadForm({ assessmentId }: EvidenceUploadFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const form = useForm<EvidenceUploadData>({
    // @ts-expect-error - Zod version mismatch with @hookform/resolvers
    resolver: zodResolver(EvidenceUploadSchema),
    defaultValues: {
      portfolioUrl: "",
    },
  });

  const handleGithubConnect = async () => {
    setConnectingGithub(true);
    try {
      // TODO: Implement GitHub OAuth connection via oRPC
      // await orpc.assessment.connectGithub()

      // Simulate connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGithubConnected(true);
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
    } finally {
      setConnectingGithub(false);
    }
  };

  const handleSkip = () => {
    startTransition(async () => {
      router.push(`/assessment/processing?assessmentId=${assessmentId}`);
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(() => {
        startTransition(async () => {
          try {
            // TODO: Upload evidence via oRPC with data
            // const portfolioUrl = form.getValues("portfolioUrl");
            // await orpc.assessment.uploadEvidence({
            //   githubConnected,
            //   portfolioUrl,
            //   cvFile,
            // })
            console.log("Upload data:", {
              cvFile,
              portfolioUrl: form.getValues("portfolioUrl"),
            });

            // Simulate upload
            await new Promise((resolve) => setTimeout(resolve, 1000));

            router.push(`/assessment/processing?assessmentId=${assessmentId}`);
          } catch (error) {
            console.error("Failed to upload evidence:", error);
          }
        });
      })}
      className="space-y-6"
    >
      {/* GitHub Connection */}
      <Card className="bg-card p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <h3 className="font-semibold text-foreground">Connect GitHub</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              {githubConnected
                ? "✓ Connected - We'll analyze your public repositories"
                : "We'll review your public repositories to understand your coding style and project complexity"}
            </p>
          </div>
          <Button
            type="button"
            variant={githubConnected ? "outline" : "default"}
            onClick={handleGithubConnect}
            disabled={connectingGithub || githubConnected}
          >
            {connectingGithub
              ? "Connecting..."
              : githubConnected
              ? "Connected"
              : "Connect"}
          </Button>
        </div>
      </Card>

      {/* Portfolio URL */}
      <Card className="bg-card p-6">
        <InputField
          label="Portfolio Website"
          description="Share a link to your portfolio, personal website, or LinkedIn profile"
          control={form.control}
          name="portfolioUrl"
          type="url"
          placeholder="https://yourportfolio.com"
          disabled={isPending}
        />
      </Card>

      {/* Resume / CV Upload */}
      <Card className="bg-card p-6">
        <FileUploadField
          label="Resume / CV"
          description="Upload your resume or CV (PDF or Word document, max 10MB)"
          onFileSelect={(file) => setCvFile(file)}
          disabled={isPending}
        />
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-muted/50 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Your privacy matters</p>
            <p className="text-muted-foreground">
              We only extract skill signals from your evidence. Your code and
              personal data are never stored or shared.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isPending}
          >
            Skip This Step
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Uploading..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
