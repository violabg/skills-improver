"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Trash2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Label } from "./label";

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
  showError?: boolean;
  className?: string;
  validateFile?: (file: File) => {
    valid: boolean;
    error?: string | undefined;
  };
  clickToUploadText?: string;
  orDragAndDropText?: string;
  fileTypesText?: string;
  invalidFileErrorText?: string;
  uploadingText?: string;
  viewCurrentFileText?: string;
  replaceText?: string;
}

export function FileUpload({
  currentFileUrl,
  onFileSelect,
  onRemoveExisting,
  isUploading = false,
  error,
  label = "File Upload",
  description = "Upload your file here.",
  disabled = false,
  required = false,
  className,
  validateFile,
  clickToUploadText = "Click to upload",
  orDragAndDropText = "or drag and drop",
  fileTypesText = "PDF, DOC, DOCX (max 10MB)",
  invalidFileErrorText = "Invalid file",
  uploadingText = "Uploading...",
  viewCurrentFileText = "View current file",
  replaceText = "Replace",
  showError = true,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (validateFile && file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setValidationError(validation.error || invalidFileErrorText);
          return;
        }
      }
      setValidationError(null);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect, validateFile, invalidFileErrorText],
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
    [disabled, isUploading, handleFileChange],
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
          "bg-muted/50 shadow-sm border-2 border-transparent border-dashed rounded-lg transition-all",
          isDragging && "border-primary bg-primary/5",
          displayError && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled &&
            !isUploading &&
            "cursor-pointer hover:bg-muted/80 hover:border-ring/30",
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
            <Loader2 className="mb-2 w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">{uploadingText}</p>
          </div>
        ) : hasSelectedFile ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
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
              <X className="size-4" />
            </Button>
          </div>
        ) : hasExistingFile ? (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{existingFileName}</p>
                <a
                  href={currentFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {viewCurrentFileText}
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
                <Upload className="mr-1 size-4" />
                {replaceText}
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
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center py-4">
            <Upload className="mb-2 w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">
              <span className="font-medium text-primary">
                {clickToUploadText}
              </span>{" "}
              {orDragAndDropText}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              {fileTypesText}
            </p>
          </div>
        )}
      </div>

      {description && !displayError && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {showError && displayError && (
        <p className="text-destructive text-sm">{displayError}</p>
      )}
    </div>
  );
}
