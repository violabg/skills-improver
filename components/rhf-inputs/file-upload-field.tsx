"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateResumeFile } from "@/lib/services/r2-storage";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader,
  Trash2,
  Upload,
  X,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";

export interface FileUploadProps {
  /** Current file URL (for edit mode) */
  currentFileUrl?: string | null;
  /** Callback when a file is selected */
  onFileSelect: (file: File | null) => void;
  /** Callback when user wants to remove existing file */
  onRemoveExisting?: () => void;
  /** Whether the upload is in progress */
  isUploading?: boolean;
  /** Optional error message */
  error?: string;
  /** Label for the field */
  label?: string;
  /** Description for the field */
  description?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Custom className */
  className?: string;
}

export function FileUploadField({
  currentFileUrl,
  onFileSelect,
  onRemoveExisting,
  isUploading = false,
  error,
  label = "Curriculum",
  description = "Carica il curriculum del candidato (PDF, DOC, DOCX - max 10MB)",
  disabled = false,
  required = false,
  className,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (file) {
        const validation = validateResumeFile(file);
        if (!validation.valid) {
          setValidationError(validation.error || "File non valido");
          return;
        }
      }
      setValidationError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0] || null;
      handleFileChange(file);
    },
    [disabled, isUploading, handleFileChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setValidationError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemoveExisting = () => {
    onRemoveExisting?.();
    handleRemoveSelected();
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const displayError = validationError || error;
  const hasExistingFile = currentFileUrl && !selectedFile;
  const hasSelectedFile = selectedFile !== null;

  // Extract filename from URL for display
  const existingFileName = currentFileUrl
    ? decodeURIComponent(currentFileUrl.split("/").pop() || "curriculum")
    : null;

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <Label>
          {label}
          {required && (
            <span aria-hidden className="ps-1 text-destructive">
              *
            </span>
          )}
        </Label>
      )}

      <div
        className={cn(
          "relative p-4 border-2 border-dashed rounded-lg transition-colors",
          isDragging && "border-primary bg-primary/5",
          displayError && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && !isUploading && "cursor-pointer hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <Input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col justify-center items-center py-4">
            <HugeiconsIcon
              icon={Loader}
              className="mb-2 w-8 h-8 text-primary animate-spin"
            />
            <p className="text-muted-foreground text-sm">
              Caricamento in corso...
            </p>
          </div>
        ) : hasSelectedFile ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={FileText} className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSelected();
              }}
              disabled={disabled}
            >
              <HugeiconsIcon icon={X} className="size-4" />
            </Button>
          </div>
        ) : hasExistingFile ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={FileText} className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{existingFileName}</p>
                <a
                  href={currentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visualizza file corrente
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                disabled={disabled}
              >
                <HugeiconsIcon icon={Upload} className="mr-1 size-4" />
                Sostituisci
              </Button>
              {onRemoveExisting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveExisting();
                  }}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <HugeiconsIcon icon={Trash2} className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-4">
            <HugeiconsIcon
              icon={Upload}
              className="mb-2 w-8 h-8 text-muted-foreground"
            />
            <p className="text-muted-foreground text-sm text-center">
              <span className="font-medium text-primary">
                Clicca per caricare
              </span>{" "}
              o trascina qui il file
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              PDF, DOC, DOCX (max 10MB)
            </p>
          </div>
        )}
      </div>

      {description && !displayError && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {displayError && (
        <p className="text-destructive text-sm">{displayError}</p>
      )}
    </div>
  );
}
