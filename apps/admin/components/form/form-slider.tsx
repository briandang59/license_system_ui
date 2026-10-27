"use client";

import { Slider } from "antd";
import type { FieldValues } from "react-hook-form";
import type { SliderSingleProps } from "antd/es/slider";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, number> & ControlProps<SliderSingleProps>;

export default function FormSlider<T extends FieldValues>({ control, name, label, disabled, ...props }: Props<T>) {
  return (
    <FormField<T, number> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => <Slider {...props} {...field} {...a11y} ariaLabelledByForHandle={a11y["aria-labelledby"]} />}
    </FormField>
  );
}
