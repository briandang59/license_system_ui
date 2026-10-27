"use client";

import { Button, Upload, type UploadFile, type UploadProps } from "antd";
import type { FieldValues } from "react-hook-form";
import FormField, { type FormControlProps, type ControlProps } from "./form-field";

type Props<T extends FieldValues> = FormControlProps<T, UploadFile[]> &
  Omit<ControlProps<UploadProps>, "fileList" | "defaultFileList" | "beforeUpload" | "action" | "customRequest">;

export default function FormUpload<T extends FieldValues>({ control, name, label, disabled, children, ...props }: Props<T>) {
  return (
    <FormField<T, UploadFile[]> control={control} name={name} label={label} disabled={disabled}>
      {(field, a11y) => (
        <Upload
          {...props}
          disabled={field.disabled}
          fileList={field.value}
          beforeUpload={() => false}
          onChange={({ fileList }) => field.onChange(fileList)}
        >
          <span onBlur={field.onBlur}>
            {children ?? <Button {...a11y} ref={field.ref} disabled={field.disabled}>Choose files</Button>}
          </span>
        </Upload>
      )}
    </FormField>
  );
}
