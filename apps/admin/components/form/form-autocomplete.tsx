"use client";

import { AutoComplete, type AutoCompleteProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, string> & ControlProps<AutoCompleteProps>;

export default function FormAutocomplete<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, string> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <AutoComplete {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
