"use client";

import { DatePicker } from "antd";
import type { FieldValues } from "react-hook-form";
import type { Dayjs } from "dayjs";
import type { RangePickerProps } from "antd/es/date-picker";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, [Dayjs | null, Dayjs | null] | null> & ControlProps<RangePickerProps>;

export default function FormDateRangePicker<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, [Dayjs | null, Dayjs | null] | null> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <DatePicker.RangePicker {...props} {...field} {...a11y} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
