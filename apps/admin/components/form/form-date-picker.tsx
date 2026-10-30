"use client";

import { DatePicker, type DatePickerProps } from "antd";
import type { FieldValues } from "react-hook-form";
import type { Dayjs } from "dayjs";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";
import { dateTimeFormat, pickerToVietnam } from "@/utils/functions/formatDateTime";

type Props<T extends FieldValues> = FormControlProps<T, Dayjs | null> & ControlProps<DatePickerProps<Dayjs, false>>;

export default function FormDatePicker<T extends FieldValues>({ control, name, label, disabled, required, ...props }: Props<T>) {
  return (
    <FormField<T, Dayjs | null> control={control} name={name} label={label} disabled={disabled} required={required}>
      {(field, a11y) => <DatePicker format={props.showTime ? dateTimeFormat : "DD/MM/YYYY"} {...props} {...field} {...a11y}
        onChange={value => field.onChange(pickerToVietnam(value))} style={{ width: "100%", ...props.style }} />}
    </FormField>
  );
}
