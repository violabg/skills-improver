import { ReactNode } from "react";
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormStateReturn,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../field";

type ControllerRenderParams<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<T>;
};

export type BaseControllerProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string | ReactNode;
  disableFieldError?: boolean;
  required?: boolean;
  children: (params: ControllerRenderParams<T>) => ReactNode;
};

export function BaseController<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  required = false,
  children,
}: BaseControllerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: !!required }}
      render={({ field, fieldState, formState }) => (
        <Field data-invalid={fieldState.invalid}>
          {label && (
            <FieldLabel htmlFor={field.name} className="font-bold">
              {label}
              {required && (
                <span aria-hidden className="ps-1 text-destructive">
                  *
                </span>
              )}
            </FieldLabel>
          )}
          <FieldContent className="gap-1">
            {children({ field, fieldState, formState })}
            {description && <FieldDescription>{description}</FieldDescription>}
            {!disableFieldError && fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </FieldContent>
        </Field>
      )}
    />
  );
}
