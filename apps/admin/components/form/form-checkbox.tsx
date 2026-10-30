"use client";

import { Checkbox, type CheckboxProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, boolean> & ControlProps<CheckboxProps>;

export default function FormCheckbox<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, boolean> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <Checkbox {...props} {...field} {...a11y} value={undefined} checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />}
    </FormField>
  );
}
