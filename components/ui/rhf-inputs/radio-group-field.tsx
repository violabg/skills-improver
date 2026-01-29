import { FieldValues } from "react-hook-form";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { BaseController, BaseControllerProps } from "./base-controller";

type RadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FieldRadioGroupProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof RadioGroup>,
  "value" | "onValueChange"
> &
  Omit<BaseControllerProps<T>, "children"> & {
    options: RadioOption[];
  };

export function RadioGroupField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  options,
  required,
  ...radioGroupProps
}: FieldRadioGroupProps<T>) {
  return (
    <BaseController
      control={control}
      name={name}
      label={label}
      required={required}
      description={description}
      disableFieldError={disableFieldError}
    >
      {({ field }) => (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          {...radioGroupProps}
        >
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${field.name}-${option.value}`}
                disabled={option.disabled}
              />
              <Label
                htmlFor={`${field.name}-${option.value}`}
                className="cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </BaseController>
  );
}
