import { FieldValues } from "react-hook-form";
import { Slider } from "../slider";
import { BaseController, BaseControllerProps } from "./base-controller";

type FieldSliderProps<T extends FieldValues> = Omit<
  React.ComponentProps<typeof Slider>,
  "value" | "onValueChange"
> &
  Omit<BaseControllerProps<T>, "children"> & {
    showValue?: boolean;
    valueFormatter?: (value: number) => string;
  };

export function SliderField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  showValue = false,
  valueFormatter,
  required,
  ...sliderProps
}: FieldSliderProps<T>) {
  return (
    <BaseController
      control={control}
      name={name}
      label={label}
      required={required}
      description={description}
      disableFieldError={disableFieldError}
    >
      {({ field }) => {
        // Base UI Slider requires a valid number array.
        // Fallback to min (or 0) when field value is undefined.
        const min = sliderProps.min ?? 0;
        const sliderValue = field.value ?? min;

        return (
          <div className="space-y-2">
            <Slider
              {...sliderProps}
              value={[sliderValue]}
              onValueChange={(newValue) => {
                // Base UI can return number or number[] depending on how it's set
                const actualValue = Array.isArray(newValue)
                  ? newValue[0]
                  : newValue;
                field.onChange(actualValue);
              }}
            />
            {showValue && (
              <div className="text-muted-foreground text-sm text-center">
                {valueFormatter ? valueFormatter(sliderValue) : sliderValue}
              </div>
            )}
          </div>
        );
      }}
    </BaseController>
  );
}
