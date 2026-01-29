"use client";

import { FieldValues } from "react-hook-form";
import { FileUpload, FileUploadProps } from "../file-upload";
import { BaseController, BaseControllerProps } from "./base-controller";

type FileUploadFieldProps<T extends FieldValues> = Omit<
  FileUploadProps,
  "onFileSelect" | "error" | "label" | "description" | "required"
> &
  Omit<BaseControllerProps<T>, "children">;

export function FileUploadField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  required,
  ...fileUploadProps
}: FileUploadFieldProps<T>) {
  return (
    <BaseController
      control={control}
      name={name}
      label={label}
      required={required}
      description={description}
      disableFieldError={disableFieldError}
    >
      {({ field, fieldState }) => (
        <FileUpload
          {...fileUploadProps}
          label=""
          description=""
          required={required}
          showError={false}
          error={fieldState.error?.message}
          onFileSelect={(file) => {
            field.onChange(file);
          }}
        />
      )}
    </BaseController>
  );
}
