"use client";

import { useId } from "react";
import { Form, Input, type InputProps } from "antd";
import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";

type FormInputProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
  label: string;
} & Omit<
  InputProps,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "id" | "status"
>;

export default function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  disabled,
  ...props
}: FormInputProps<T>) {
  const id = useId();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name, disabled });
  const Component = type === "password" ? Input.Password : Input;

  return (
    <Form.Item
      label={label}
      htmlFor={id}
      layout="vertical"
      validateStatus={error ? "error" : undefined}
      help={
        error ? (
          <span id={`${id}-error`} role="alert">
            {error.message}
          </span>
        ) : undefined
      }
    >
      <Component
        {...props}
        {...field}
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Form.Item>
  );
}
