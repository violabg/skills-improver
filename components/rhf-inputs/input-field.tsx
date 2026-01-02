import { InputHTMLAttributes } from "react";
import { FieldValues } from "react-hook-form";
import { Input } from "../ui/input";
import { BaseController, BaseControllerProps } from "./base-controller";

type FieldInputProps<T extends FieldValues> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "id"
> & {
  maxLength?: number;
} & Omit<BaseControllerProps<T>, "children">;

export function InputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  maxLength,
  disableFieldError = false,
  required,
  ...inputProps
}: FieldInputProps<T> & { required?: boolean }) {
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
        <div className="relative">
          <Input
            id={field.name}
            aria-invalid={!!fieldState.error}
            aria-required={required}
            aria-describedby={
              fieldState.error ? `${field.name}-error` : undefined
            }
            {...field}
            value={field.value ?? ""}
            {...inputProps}
            className={`${maxLength ? "pr-16" : ""} ${
              inputProps.className || ""
            }`}
          />
          {maxLength && (
            <div className="top-1/2 right-3 absolute text-muted-foreground text-xs -translate-y-1/2 pointer-events-none">
              {(field.value || "").length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </BaseController>
  );
}
