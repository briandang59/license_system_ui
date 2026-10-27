import { ApiError } from "./api";

const errorMessages: Record<string, string> = {
  ALREADY_EXISTS: "Đã có bản ghi trùng hoặc giá đang hiệu lực bị chồng lấn.",
  RESOURCE_IN_USE: "Bản ghi đang được sử dụng, không thể xóa hoặc thay đổi.",
  NOT_FOUND: "Không tìm thấy bản ghi được yêu cầu.",
  API_UNAVAILABLE: "Dịch vụ hiện không khả dụng. Vui lòng thử lại sau.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  UNAUTHORIZED: "Vui lòng đăng nhập để tiếp tục.",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  LICENSE_EXPIRED: "Bản quyền của bạn đã hết hạn.",
  LICENSE_NOT_FOUND: "Không tìm thấy bản quyền.",
  AUTH_UNAVAILABLE: "Dịch vụ xác thực hiện không khả dụng. Vui lòng thử lại sau.",
  VALIDATION_ERROR: "Kiểm tra dữ liệu đã nhập và thử lại.",
};

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
  }

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  switch (error.status) {
    case 401:
      return "Thông tin đăng nhập không hợp lệ hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 429:
      return "Có quá nhiều yêu cầu. Vui lòng thử lại sau.";
    default:
      return "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
  }
}
