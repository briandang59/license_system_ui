"use client";

import { TreeSelect, type TreeSelectProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, string | number | (string | number)[] | null | undefined> & ControlProps<TreeSelectProps>;

export default function FormTreeSelect<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, string | number | (string | number)[] | null | undefined> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <TreeSelect {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
