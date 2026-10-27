export type BaseResponse<T> = {
  error?: {
    code: string;
    message: string;
  };
  data: T;
  success: boolean;
};
