# Form controls

Các component dùng React Hook Form làm nguồn dữ liệu duy nhất, với label, error, blur/touched, disabled và ref. Truyền `control`, `name`, `label` và props Ant Design tương ứng. Không truyền `value`, `defaultValue`, `onChange`, `onBlur` hoặc `id`; đặt giá trị ban đầu trong `useForm({ defaultValues })`, validation trong schema/resolver.

```tsx
import FormSelect from "@/components/form/form-select";

<FormSelect
  control={control}
  name="status"
  label="Trạng thái"
  required
  disabled={save.isPending}
  options={[
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Ngừng hoạt động" },
  ]}
```

| Component / file `form-*.tsx` | Giá trị trong form |
| --- | --- |
| `FormInput` / `input` | `string`; `type="password"` dùng Input.Password |
| `FormTextarea` / `textarea` | `string` |
| `FormInputNumber` / `input-number` | `number \| null` |
| `FormSelect` / `select` | Chuỗi/số; mảng khi dùng `mode="multiple"` hoặc `"tags"` |
| `FormAutocomplete` / `autocomplete` | `string` |
| `FormTreeSelect` / `tree-select` | Chuỗi/số; mảng khi dùng `multiple` hoặc `treeCheckable` |
| `FormCheckbox` / `checkbox` | `boolean`; nội dung cạnh ô chọn qua `children` |
| `FormCheckboxGroup` / `checkbox-group` | `(string \| number)[]`; lựa chọn qua `options` |
| `FormRadioGroup` / `radio-group` | `string \| number \| boolean \| null`; `options`, `optionType="button"` được hỗ trợ |
| `FormSwitch` / `switch` | `boolean` |
| `FormDatePicker` / `date-picker` | `Dayjs \| null`; hỗ trợ `picker`, `showTime` |
| `FormDateRangePicker` / `date-range-picker` | `[Dayjs \| null, Dayjs \| null] \| null` |
| `FormTimePicker` / `time-picker` | `Dayjs \| null` |
| `FormTimeRangePicker` / `time-range-picker` | `[Dayjs \| null, Dayjs \| null] \| null` |
| `FormSlider` / `slider` | `number` |
| `FormRangeSlider` / `range-slider` | `number[]` |
| `FormRate` / `rate` | `number` |
| `FormUpload` / `upload` | `UploadFile[]`; mặc định `[]` |

Select và TreeSelect giữ hành vi clear của Ant Design (`undefined`); dùng field optional trong schema nếu bật `allowClear`. Các control dùng giá trị nguyên thủy, không bật `labelInValue`/`treeCheckStrictly`, hoặc `stringMode` cho InputNumber. Với date/time, khởi tạo bằng `dayjs(...)` hoặc `null`, validate bằng schema nhận Dayjs và chuyển thành chuỗi theo contract backend khi submit; không truyền chuỗi ISO trực tiếp vào picker.

InputNumber mặc định phân cách hàng nghìn bằng dấu phẩy (20,000,000), giữ giá trị là number; parser bỏ dấu phân cách, không đổi ô trống thành giá 0. DatePicker hiển thị DD/MM/YYYY HH:mm khi showTime và hiểu giờ chọn theo Asia/Ho_Chi_Minh. Dùng parseDateTime để mở timestamp API, vietnamNow cho mặc định và toISOString khi submit. Dữ liệu form là Dayjs hoặc null; không bắt người dùng nhập ISO.

Upload không tự gửi HTTP request: `beforeUpload` luôn trả `false`, danh sách file được lưu trong form. Khi submit, kiểm tra kiểu/kích thước file và gửi `originFileObj` bằng FormData ở service theo contract backend. `accept` chỉ hỗ trợ lọc file trong hộp chọn, không thay thế validation phía client/server.

Không dùng `FormField` để tạo form state thứ hai. Khi cần một loại control mới, dùng nó để giữ cách hiển thị label/lỗi thống nhất; `FormField` là phần nội bộ, các trang nên dùng `Form*` cụ thể.


Truyền `required` cho trường mà schema yêu cầu nhập; FormField hiển thị dấu * đỏ bằng Ant Design và đặt aria-required cho control. Với quy tắc có điều kiện, dùng cùng điều kiện với validation (ví dụ tài khoản/tham chiếu chỉ bắt buộc khi chuyển khoản). Field tùy chọn không truyền required. Dấu này không thay thế kiểm tra Zod/backend. Khoảng cách giữa các field là 20px.
