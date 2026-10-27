"use client";

import { TimePicker, type TimeRangePickerProps } from "antd";
import type { FieldValues } from "react-hook-form";
import type { Dayjs } from "dayjs";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, [Dayjs | null, Dayjs | null] | null> & ControlProps<TimeRangePickerProps>;

export default function FormTimeRangePicker<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, [Dayjs | null, Dayjs | null] | null> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <TimePicker.RangePicker {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
