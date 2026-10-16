"use client";

import { Select, type SelectProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, string | number | (string | number)[] | null | undefined> & ControlProps<SelectProps>;

export default function FormSelect<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, string | number | (string | number)[] | null | undefined> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <Select {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
