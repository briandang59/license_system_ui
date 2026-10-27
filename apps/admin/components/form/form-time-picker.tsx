"use client";

import { TimePicker, type TimePickerProps } from "antd";
import type { FieldValues } from "react-hook-form";
import type { Dayjs } from "dayjs";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, Dayjs | null> & ControlProps<TimePickerProps>;

export default function FormTimePicker<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, Dayjs | null> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <TimePicker {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
