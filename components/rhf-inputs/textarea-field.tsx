import { FieldValues } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { BaseController, BaseControllerProps } from "./base-controller";

type FieldTextareaProps<T extends FieldValues> = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name" | "id"
> & {
  maxLength?: number;
} & Omit<BaseControllerProps<T>, "children">;

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  maxLength,
  disableFieldError = false,
  required,
  ...textareaProps
}: FieldTextareaProps<T> & { required?: boolean }) {
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
          <Textarea
            id={field.name}
            aria-required={required}
            {...field}
            {...textareaProps}
            aria-invalid={!!fieldState.error}
            aria-describedby={
              fieldState.error ? `${field.name}-error` : undefined
            }
            className={`${maxLength ? "pr-16" : ""} ${
              textareaProps.className || ""
            }`}
          />
          {maxLength && (
            <div className="top-3 right-3 absolute bg-background/80 px-1 rounded text-muted-foreground text-xs pointer-events-none">
              {(field.value || "").length}/{maxLength}
            </div>
          )}
        </div>
      )}
    </BaseController>
  );
}
