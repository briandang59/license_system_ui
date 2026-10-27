"use client";

import { Switch, type SwitchProps } from "antd";
import type { FieldValues } from "react-hook-form";

import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, boolean> & ControlProps<SwitchProps>;

export default function FormSwitch<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, boolean> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <Switch {...props} {...field} {...a11y} value={undefined} checked={field.value} onChange={field.onChange} />}
    </FormField>
  );
}
