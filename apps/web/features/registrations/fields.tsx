"use client";
import { useId } from "react";
import { Form, Input, InputNumber, Select } from "antd";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";

// Public app owns its controls; importing admin components would cross app boundaries.
export function Field<T extends FieldValues>({ control, name, label, kind = "text", options, disabled }: { control: Control<T>; name: FieldPath<T>; label: string; kind?: "text" | "email" | "textarea" | "number" | "select"; options?: { value: number | string; label: string }[]; disabled?: boolean }) {
 const id = useId(); const { field, fieldState: { error } } = useController({ control, name });
 const props = { id, disabled, "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined };
 return <Form.Item layout="vertical" label={label} htmlFor={id} validateStatus={error ? "error" : undefined} help={error ? <span id={`${id}-error`} role="alert">{error.message}</span> : undefined}>
 {kind === "select" ? <Select {...field} {...props} allowClear onChange={value => field.onChange(value ?? null)} options={options} style={{ width: "100%" }} /> : kind === "number" ? <InputNumber {...field} {...props} min={0} max={Number.MAX_SAFE_INTEGER} precision={0} style={{ width: "100%" }} /> : kind === "textarea" ? <Input.TextArea {...field} {...props} rows={3} /> : <Input {...field} {...props} type={kind} />}
 </Form.Item>;
}
