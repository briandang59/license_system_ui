"use client";

import { Radio, type RadioGroupProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, string | number | boolean | null> & ControlProps<RadioGroupProps>;

export default function FormRadioGroup<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, string | number | boolean | null> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <Radio.Group {...props} {...field} {...a11y} />}
    </FormField>
  );
}
