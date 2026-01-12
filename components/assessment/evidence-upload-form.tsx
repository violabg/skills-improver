"use client";

import { FileUploadField } from "@/components/rhf-inputs";
import { SwitchField } from "@/components/rhf-inputs/switch-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAssessment } from "@/lib/hooks/use-assessment";
import { client } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const EvidenceUploadSchema = z.object({
  retentionChoice: z.enum(["discard", "30d", "90d"]).default("discard"),
  allowRawStorage: z.boolean().default(false),
  useCvForAnalysis: z.boolean().default(false),
});

type EvidenceUploadData = z.infer<typeof EvidenceUploadSchema>;

interface EvidenceUploadFormProps {
  initialCvUrl: string | null;
  initialUseCvForAnalysis: boolean;
}

export function EvidenceUploadForm({
  initialCvUrl,
  initialUseCvForAnalysis,
}: EvidenceUploadFormProps) {
  const assessment = useAssessment();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [currentCvUrl, setCurrentCvUrl] = useState<string | null>(initialCvUrl);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isDeletingCv, setIsDeletingCv] = useState(false);

  const resolver = zodResolver(
    EvidenceUploadSchema as unknown as never
  ) as Resolver<EvidenceUploadData>;

  const form = useForm<EvidenceUploadData>({
    resolver,
    defaultValues: {
      retentionChoice: "discard",
      allowRawStorage: false,
      useCvForAnalysis: initialUseCvForAnalysis,
    },
  });

  const handleGithubConnect = async () => {
    setConnectingGithub(true);
    try {
      const { retentionChoice, allowRawStorage } = form.getValues();
      const retentionDays =
        retentionChoice === "30d" ? 30 : retentionChoice === "90d" ? 90 : 0;

      await client.evidence.connectGithub({
        retentionDays,
        allowRawStorage,
      });
      setGithubConnected(true);
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
      alert(
        "Failed to fetch GitHub data. Make sure you're logged in with GitHub."
      );
    } finally {
      setConnectingGithub(false);
    }
  };

  const handleCvUpload = async (file: File) => {
    setIsUploadingCv(true);
    try {
      // If there's an existing CV, delete it first
      if (currentCvUrl) {
        await client.user.deleteCv({});
      }

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const result = await client.user.uploadCv({
        fileName: file.name,
        fileType: file.type,
        fileBase64: base64,
        fileSize: file.size,
      });

      setCurrentCvUrl(result.cvUrl);
      setCvFile(null);
    } catch (error) {
      console.error("Failed to upload CV:", error);
      alert("Failed to upload CV. Please try again.");
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleCvDelete = async () => {
    setIsDeletingCv(true);
    try {
      await client.user.deleteCv({});
      setCurrentCvUrl(null);
      setCvFile(null);
    } catch (error) {
      console.error("Failed to delete CV:", error);
      alert("Failed to delete CV. Please try again.");
    } finally {
      setIsDeletingCv(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (file) {
      setCvFile(file);
      await handleCvUpload(file);
    }
  };

  const handleSkip = () => {
    startTransition(async () => {
      router.push(`/assessment/${assessment.id}/results`);
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(() => {
        startTransition(async () => {
          try {
            const { retentionChoice, allowRawStorage, useCvForAnalysis } =
              form.getValues();

            const retentionDays =
              retentionChoice === "30d"
                ? 30
                : retentionChoice === "90d"
                ? 90
                : 0;

            // Update user's CV preference
            await client.user.update({ useCvForAnalysis });

            router.push(`/assessment/${assessment.id}/results`);
          } catch (error) {
            console.error("Failed to save evidence preferences:", error);
            alert(
              "We could not save your evidence preferences. Please retry or skip."
            );
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

      {/* Resume / CV Upload */}
      <Card className="space-y-4 bg-card p-6">
        <FileUploadField
          label="Resume / CV"
          description="Upload your resume or CV (PDF or Word document, max 10MB)"
          currentFileUrl={currentCvUrl}
          onFileSelect={handleFileSelect}
          onRemoveExisting={handleCvDelete}
          isUploading={isUploadingCv}
          disabled={isPending || isDeletingCv}
        />

        <SwitchField
          control={form.control}
          name="useCvForAnalysis"
          label="Use CV for skill analysis"
          description="When enabled, the AI will analyze your CV content to provide more accurate skill gap assessments."
          disabled={!currentCvUrl && !cvFile}
        />
      </Card>

      {/* Consent & Retention */}
      <Card className="space-y-4 bg-card p-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Consent & retention</h3>
          <p className="text-muted-foreground text-sm">
            Choose how long we can keep extracted signals. Raw artifacts are
            only stored if you explicitly allow it.
          </p>
        </div>

        <Controller
          control={form.control}
          name="retentionChoice"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="font-medium text-foreground text-sm">
                Signal retention
              </label>
              <div className="gap-2 grid sm:grid-cols-3 mt-4">
                {[
                  { value: "discard", label: "Discard after analysis" },
                  { value: "30d", label: "Keep for 30 days" },
                  { value: "90d", label: "Keep for 90 days" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      field.value === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/60"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Controller
          control={form.control}
          name="allowRawStorage"
          render={({ field }) => (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 border-border rounded w-4 h-4"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span>
                Allow temporary storage of raw artifacts (e.g., GitHub metadata)
                according to the selected retention window.
              </span>
            </label>
          )}
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
              We extract minimal skill signals. Raw data is only retained if you
              opt in, and you control the retention window above.
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
          <Button type="submit" disabled={isPending || isUploadingCv}>
            {isPending ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </form>
  );
}
