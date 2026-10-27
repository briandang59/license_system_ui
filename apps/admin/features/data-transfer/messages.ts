import type { ImportResult } from "./schema";

const messages: Record<string, string> = {
  "duplicate key within this file": "Khóa dữ liệu bị trùng trong cùng tệp.",
  "parent ID does not match the selected record": "ID cha không khớp với bản ghi đang chọn.",
  "status must be active or inactive": "Trạng thái phải là active hoặc inactive.",
  "invalid feature_type": "Loại tính năng phải là boolean, quantity hoặc unlimited.",
  "enabled must be true or false": "Giá trị bật/tắt phải là true hoặc false.",
  "currency must contain 3 uppercase ASCII letters": "Mã tiền tệ phải gồm 3 chữ cái ASCII viết hoa.",
  "invalid billing_interval": "Chu kỳ thanh toán phải là month, year hoặc one_time.",
  "effective_to must follow effective_from": "Ngày kết thúc hiệu lực phải sau ngày bắt đầu.",
  "Invalid value, immutable price field, or missing related record.": "Giá trị không hợp lệ, trường giá không được phép sửa hoặc thiếu bản ghi liên quan.",
  "The referenced record was not found.": "Không tìm thấy bản ghi được tham chiếu.",
  "Duplicate record or overlapping active price period.": "Bản ghi bị trùng hoặc khoảng giá hiệu lực chồng lấn.",
  "The record is referenced and this change is not allowed.": "Bản ghi đang được tham chiếu, không cho phép thay đổi này.",
};
const fields: Record<string, string> = {
  code: "Mã", name: "Tên", description: "Mô tả", product_id: "ID sản phẩm",
  plan_id: "ID gói dịch vụ", feature_id: "ID tính năng", unit_id: "ID đơn vị tính",
  price_id: "ID giá", amount_minor: "Số tiền", limit_value: "Hạn mức",
  effective_from: "Ngày bắt đầu hiệu lực", effective_to: "Ngày kết thúc hiệu lực",
  tax_code: "Mã số thuế", email: "Email", phone: "Số điện thoại", symbol: "Ký hiệu",
};

export function importRowMessage(row: ImportResult["rows"][number]): string {
  if (row.action !== "error") return "";
  if (messages[row.message]) return messages[row.message];
  const match = /^(\w+) (is required|must be a valid positive integer|must be a valid non-negative integer|must be an ISO timestamp with timezone|contains a null character|exceeds (\d+) characters|must contain between (\d+) and (\d+) characters)$/.exec(row.message);
  if (match && fields[match[1]]) {
    const field = fields[match[1]];
    const issue = match[2];
    if (issue === "is required") return `${field} là bắt buộc.`;
    if (issue === "must be a valid positive integer") return `${field} phải là số nguyên dương hợp lệ.`;
    if (issue === "must be a valid non-negative integer") return `${field} phải là số nguyên không âm hợp lệ.`;
    if (issue === "must be an ISO timestamp with timezone") return `${field} phải là ngày ISO có múi giờ.`;
    if (issue === "contains a null character") return `${field} chứa ký tự không hợp lệ.`;
    if (match[3]) return `${field} không được vượt quá ${match[3]} ký tự.`;
    return `${field} phải có từ ${match[4]} đến ${match[5]} ký tự.`;
  }
  return "Dữ liệu dòng không hợp lệ. Kiểm tra giá trị, quan hệ tham chiếu và quy tắc nhập dữ liệu.";
}
