"use client";

import { InputNumber, type InputNumberProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, number | null> & ControlProps<InputNumberProps<number>>;

export default function FormInputNumber<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, number | null> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <InputNumber {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
