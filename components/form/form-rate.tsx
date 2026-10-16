"use client";

import { Rate, type RateProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, number> & ControlProps<RateProps>;

export default function FormRate<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, number> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <Rate {...props} {...field} {...a11y} />}
    </FormField>
  );
}
