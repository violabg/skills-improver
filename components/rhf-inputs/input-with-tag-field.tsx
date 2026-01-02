import InputWithTags from "@/components/ui/input-with-tag";
import { FieldValues } from "react-hook-form";
import { BaseController, BaseControllerProps } from "./base-controller";

type Props<T extends FieldValues> = {
  placeholder?: string;
} & Omit<BaseControllerProps<T>, "children">;

export function InputWithTagField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disableFieldError = false,
  placeholder,
  required,
}: Props<T>) {
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
        <InputWithTags
          id={field.name}
          // The TagInput component expects an array of tags
          // Ensure we always pass an array, defaulting to empty if undefined
          placeholder={placeholder}
          value={(field.value as string[] | undefined) || []}
          onChange={(newTags: string[]) => field.onChange(newTags)}
        />
      )}
    </BaseController>
  );
}
