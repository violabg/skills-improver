import { Controller, FieldValues } from "react-hook-form";
import { Checkbox } from "../checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../field";
import { BaseControllerProps } from "./base-controller";

type FieldCheckboxProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof Checkbox>,
  "checked" | "onCheckedChange"
> &
  Omit<BaseControllerProps<T>, "children"> & {
    orientation?: "vertical" | "horizontal";
  };

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  orientation = "horizontal",
  required,
  ...checkboxProps
}: FieldCheckboxProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation={orientation}>
          <FieldContent>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                {...checkboxProps}
              />
              <div className="space-y-1 leading-none">
                {label && (
                  <FieldLabel>
                    {label}
                    {required && (
                      <span aria-hidden className="ps-1 text-destructive">
                        *
                      </span>
                    )}
                  </FieldLabel>
                )}
                {description && (
                  <FieldDescription>{description}</FieldDescription>
                )}
              </div>
            </div>
          </FieldContent>
          {!disableFieldError && fieldState.invalid && (
            <FieldError errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  );
}
