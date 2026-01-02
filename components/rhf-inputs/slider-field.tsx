import { FieldValues } from "react-hook-form";
import { Slider } from "../ui/slider";
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
      {({ field }) => (
        <div className="space-y-2">
          <Slider
            value={[field.value]}
            onValueChange={(values) => field.onChange(values[0])}
            {...sliderProps}
          />
          {showValue && (
            <div className="text-muted-foreground text-sm text-center">
              {valueFormatter ? valueFormatter(field.value) : field.value}
            </div>
          )}
        </div>
      )}
    </BaseController>
  );
}
