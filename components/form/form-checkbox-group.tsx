"use client";

import { Checkbox } from "antd";
import type { FieldValues } from "react-hook-form";
import type { CheckboxGroupProps } from "antd/es/checkbox";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, (string | number)[]> & ControlProps<CheckboxGroupProps<string | number>>;

export default function FormCheckboxGroup<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, (string | number)[]> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <Checkbox.Group {...props} {...field} {...a11y} />}
    </FormField>
  );
}
