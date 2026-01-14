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
      className="space-y-8 mx-auto max-w-4xl"
    >
      <div className="gap-6 grid md:grid-cols-2">
        {/* GitHub Connection */}
        <Card className="bg-card shadow-sm hover:shadow-md border-border/50 hover:border-primary/20 h-full transition-all">
          <div className="flex flex-col p-6 h-full">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-muted p-3 rounded-xl">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Connect GitHub</h3>
                <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                  We'll analyze your public code contributions to assess
                  architectural patterns and code quality.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4">
              {githubConnected ? (
                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-lg font-medium text-green-600 text-sm">
                  ✓ Connected successfully
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleGithubConnect}
                  disabled={connectingGithub}
                >
                  {connectingGithub
                    ? "Connecting..."
                    : "Connect GitHub Account"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Resume / CV Upload */}
        <Card className="bg-card shadow-sm hover:shadow-md border-border/50 hover:border-primary/20 h-full transition-all">
          <div className="flex flex-col space-y-4 p-6 h-full">
            <FileUploadField
              label="Upload Resume / CV"
              description="PDF or Word documents (Max 10MB)"
              currentFileUrl={currentCvUrl}
              onFileSelect={handleFileSelect}
              onRemoveExisting={handleCvDelete}
              isUploading={isUploadingCv}
              disabled={isPending || isDeletingCv}
            />

            <div className="pt-2 border-border/50 border-t">
              <SwitchField
                control={form.control}
                name="useCvForAnalysis"
                label="Analyze CV for skills"
                description="Allow AI to extract skills and experience from your resume."
                disabled={!currentCvUrl && !cvFile}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Consent & Retention */}
      <Card className="space-y-6 bg-card/50 p-6 border-border/50">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 p-2 rounded-lg text-primary">🛡️</span>
          <div>
            <h3 className="font-semibold text-foreground">
              Data Privacy & Retention
            </h3>
            <p className="text-muted-foreground text-sm">
              You control your data. Choose how long we keep your artifacts.
            </p>
          </div>
        </div>

        <div className="gap-8 grid md:grid-cols-2">
          <Controller
            control={form.control}
            name="retentionChoice"
            render={({ field }) => (
              <div className="space-y-3">
                <label className="block font-medium text-foreground text-sm">
                  Retention Period
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      value: "discard",
                      label: "Discard immediately after analysis",
                      icon: "🗑️",
                    },
                    { value: "30d", label: "Keep for 30 days", icon: "📅" },
                    { value: "90d", label: "Keep for 90 days", icon: "🗓️" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`
                            group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all
                            ${
                              field.value === option.value
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                            }
                        `}
                    >
                      <span className="text-base">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          />

          <div className="space-y-4">
            <div className="space-y-3 bg-muted/50 p-4 border border-border/50 rounded-lg text-sm">
              <p className="font-medium text-foreground">
                Information we extract:
              </p>
              <ul className="space-y-1 ml-1 text-muted-foreground list-disc list-inside">
                <li>Public repository languages and frameworks</li>
                <li>Commit history frequency (not content)</li>
                <li>Project descriptions and README tech stacks</li>
                <li>Resume skills and work history dates</li>
              </ul>
            </div>

            <Controller
              control={form.control}
              name="allowRawStorage"
              render={({ field }) => (
                <label className="flex items-start gap-3 hover:bg-muted/50 p-3 rounded-lg text-sm transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 border-border rounded w-4 h-4 accent-primary"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span className="text-muted-foreground">
                    Allow temporary storage of raw artifacts (e.g. JSON
                    metadata) for debugging.
                  </span>
                </label>
              )}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          ← Back
        </Button>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            disabled={isPending || isUploadingCv}
            className="shadow-lg shadow-primary/20 px-8 rounded-full"
            size="lg"
          >
            {isPending ? "Generating Results..." : "Complete Assessment →"}
          </Button>
        </div>
      </div>
    </form>
  );
}
