const labels: Record<string, string> = {
  active: "Hoạt động", inactive: "Ngừng hoạt động",
  pending: "Chờ xử lý", past_due: "Quá hạn thanh toán", cancel: "Đã hủy", expired: "Hết hạn",
  boolean: "Bật/tắt", quantity: "Số lượng", unlimited: "Không giới hạn",
  month: "Hàng tháng", monthly: "Hàng tháng", year: "Hàng năm", yearly: "Hàng năm", one_time: "Một lần",
  create: "Tạo mới", update: "Cập nhật", error: "Lỗi",
  products: "Sản phẩm", companies: "Doanh nghiệp", plans: "Gói dịch vụ", features: "Tính năng",
  payments: "Thanh toán", subscriptions: "Đăng ký dịch vụ", units: "Đơn vị tính", licenses: "Bản quyền",
};

/** Translate display values only; request values and business codes stay unchanged. */
export function displayLabel(value: string): string {
  return labels[value] ?? "Không xác định";
}
