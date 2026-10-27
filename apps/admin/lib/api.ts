import type { BaseResponse } from "./baseResponse";

export class ApiError extends Error {
  constructor(
    public status: number,
    message = `Yêu cầu thất bại (${status}). Vui lòng thử lại.`,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// shortcut: 204 trả undefined, dùng api<void> cho endpoint không có dữ liệu.
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  let body: BaseResponse<T>;

  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, "Máy chủ trả về dữ liệu JSON không hợp lệ.");
  }

  if (!body || typeof body.success !== "boolean") {
    throw new ApiError(response.status, "Máy chủ trả về phản hồi API không hợp lệ.");
  }

  if (!response.ok || !body.success) {
    throw new ApiError(
      response.status,
      typeof body.error?.message === "string" ? body.error.message : undefined,
      typeof body.error?.code === "string" ? body.error.code : undefined,
    );
  }

  if (!("data" in body)) {
    throw new ApiError(response.status, "Phản hồi máy chủ thiếu dữ liệu.");
  }

  return body.data;
}
