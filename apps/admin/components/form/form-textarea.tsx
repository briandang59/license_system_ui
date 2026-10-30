"use client";

import { Input } from "antd";
import type { FieldValues } from "react-hook-form";
import type { TextAreaProps } from "antd/es/input";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, string> & ControlProps<TextAreaProps>;

export default function FormTextarea<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, string> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <Input.TextArea {...props} {...field} {...a11y} />}
    </FormField>
  );
}
