import { ApiError } from "./api";

const errorMessages: Record<string, string> = {
  ALREADY_EXISTS: "A matching record or overlapping active price already exists.",
  RESOURCE_IN_USE: "This record is in use and cannot be deleted or changed.",
  NOT_FOUND: "The requested record was not found.",
  API_UNAVAILABLE: "The service is unavailable. Please try again later.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "Please sign in to continue.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  LICENSE_EXPIRED: "Your license has expired.",
  LICENSE_NOT_FOUND: "License not found.",
  AUTH_UNAVAILABLE: "The authentication service is unavailable. Please try again later.",
  VALIDATION_ERROR: "Check the entered values and try again.",
};

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to complete the request. Please try again.";
  }

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  switch (error.status) {
    case 401:
      return "Invalid credentials or an expired session. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 429:
      return "Too many requests. Please try again later.";
    default:
      return "Unable to complete the request. Please try again.";
  }
}
