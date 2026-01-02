import { DateFieldProps, DateValue } from "react-aria-components";
import { FieldValues } from "react-hook-form";
import { DateField, DateInput, DateInputProps } from "../ui/datefield-rac";
import { BaseController, BaseControllerProps } from "./base-controller";

type FieldInputProps<T extends FieldValues> = Omit<
  BaseControllerProps<T>,
  "children"
> &
  Omit<DateFieldProps<DateValue>, "value" | "onChange" | "children"> &
  Pick<DateInputProps, "className" | "unstyled">;

export function InputDateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  className,
  required,
  ...inputProps
}: FieldInputProps<T>) {
  return (
    <BaseController
      control={control}
      name={name}
      label={label}
      required={required}
      description={description}
      disableFieldError={disableFieldError}
    >
      {({ field, fieldState }) => {
        return (
          <DateField className="*:not-first:mt-2" {...field} {...inputProps}>
            <DateInput
              className={className}
              aria-invalid={!!fieldState.error}
              aria-required={required}
              aria-describedby={
                fieldState.error ? `${field.name}-error` : undefined
              }
            />
          </DateField>
        );
      }}
    </BaseController>
  );
}
