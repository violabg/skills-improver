import { ReactNode, RefAttributes } from "react";
import { FieldValues } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { BaseController, BaseControllerProps } from "./base-controller";

const EMPTY_SELECT_VALUE = "";

type SelectOption = {
  value: string;
  label: string;
  leading?: ReactNode;
};

type FieldSelectProps<T extends FieldValues> = {
  placeholder?: string;
  onValueChange?: (value: string | null) => void;
  selectProps?: React.ComponentProps<typeof Select>;
  triggerProps?: React.ComponentProps<typeof SelectTrigger> &
    RefAttributes<HTMLButtonElement> & {
      size?: "sm" | "default";
    };
} & Omit<BaseControllerProps<T>, "children"> &
  (
    | {
        options: SelectOption[];
        children?: never;
      }
    | {
        options?: never;
        children: ReactNode;
      }
  );

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  options,
  placeholder,
  onValueChange,
  triggerProps,
  children,
  required,
  ...selectProps
}: FieldSelectProps<T>) {
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
          <Select
            value={field.value ?? EMPTY_SELECT_VALUE}
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            {...selectProps}
          >
            <SelectTrigger
              aria-required={required}
              aria-invalid={!!fieldState.error}
              data-invalid={!!fieldState.error}
              {...triggerProps}
            >
              {placeholder &&
              (field.value === EMPTY_SELECT_VALUE ||
                field.value === undefined ||
                field.value === null) ? (
                <SelectValue>{placeholder}</SelectValue>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {placeholder && (
                <SelectItem value={null} key="placeholder">
                  {placeholder}
                </SelectItem>
              )}
              {options
                ? options.map((option) => {
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        {option.leading ? (
                          <span className="flex items-center gap-2">
                            {option.leading}
                            <span>{option.label}</span>
                          </span>
                        ) : (
                          option.label
                        )}
                      </SelectItem>
                    );
                  })
                : children}
            </SelectContent>
          </Select>
        );
      }}
    </BaseController>
  );
}
