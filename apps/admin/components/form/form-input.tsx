"use client";

import { Input, type InputProps } from "antd";
import type { FieldValues } from "react-hook-form";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type FormInputProps<T extends FieldValues> = FormControlProps<T, string> & ControlProps<InputProps>;

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  disabled, required,
  ...props
}: FormInputProps<T>) {
  const Component = type === "password" ? Input.Password : Input;

  return (
    <FormField<T, string> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <Component {...props} {...field} {...a11y} type={type} />}
    </FormField>
  );
}
