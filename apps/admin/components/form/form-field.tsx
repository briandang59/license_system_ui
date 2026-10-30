"use client";

import { useId, type ReactNode } from "react";
import { Form } from "antd";
import { useController, type Control, type ControllerRenderProps, type FieldPathByValue, type FieldValues } from "react-hook-form";

export type FormControlProps<T extends FieldValues, V> = {
  control: Control<T>;
  name: FieldPathByValue<T, V>;
  label: ReactNode;
  disabled?: boolean;
  required?: boolean;
};

export type ControlProps<P> = Omit<P,
  "name" | "value" | "defaultValue" | "checked" | "defaultChecked" |
  "onChange" | "onBlur" | "id" | "status" | "disabled" |
  "aria-invalid" | "aria-describedby" | "aria-labelledby"
>;

export default function FormField<T extends FieldValues, V>({
  control, name, label, disabled, required = false, children,
}: FormControlProps<T, V> & {
  children: (field: Omit<ControllerRenderProps<T>, "value"> & { value: V }, accessibility: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
    "aria-labelledby": string;
    "aria-required": boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const { field, fieldState: { error } } = useController({ control, name, disabled });
  return (
    <Form.Item
      label={<span id={`${id}-label`}>{label}</span>}
      htmlFor={id}
      layout="vertical"
      required={required}
      style={{ marginBottom: 20 }}
      validateStatus={error ? "error" : undefined}
      help={error ? <span id={`${id}-error`} role="alert">{error.message}</span> : undefined}
    >
      {children(
        // FieldPathByValue constrains the value; TypeScript cannot resolve it for generic T.
        field as Omit<ControllerRenderProps<T>, "value"> & { value: V },
        { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined, "aria-labelledby": `${id}-label`, "aria-required": required },
      )}
    </Form.Item>
  );
}
