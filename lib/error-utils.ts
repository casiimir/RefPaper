import { ERROR_MESSAGES, UI_MESSAGES, PLAN_LIMITS } from "./constants";

export interface ApiErrorResponse {
  error: string;
  message?: string;
  questionsUsed?: number;
  limit?: number;
}

export interface ParsedError {
  type: "rate_limit" | "server_error" | "network_error" | "unknown";
  title: string;
  message: string;
  questionsUsed?: number;
  limit?: number;
}

export function parseApiError(error: unknown): ParsedError {
  // Handle fetch/network errors
  if (error instanceof TypeError || (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes("fetch"))) {
    return {
      type: "network_error",
      title: "Connection Error",
      message: "Unable to connect to the server. Please check your internet connection.",
    };
  }

  // Handle API response errors
  if (error && typeof error === 'object' && ('error' in error || 'message' in error)) {
    const errorData = error as ApiErrorResponse;

    // Rate limit errors
    if (errorData.error?.includes("limit") || errorData.message?.includes("limit")) {
      return {
        type: "rate_limit",
        title: UI_MESSAGES.MONTHLY_LIMIT_TITLE,
        message: errorData.message || ERROR_MESSAGES.MONTHLY_LIMIT_REACHED,
        questionsUsed: errorData.questionsUsed,
        limit: errorData.limit || PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
      };
    }

    // Other API errors
    return {
      type: "server_error",
      title: "Server Error",
      message: errorData.message || errorData.error || "An unexpected error occurred",
    };
  }

  // Unknown errors
  return {
    type: "unknown",
    title: "Error",
    message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string')
      ? error.message
      : "An unexpected error occurred. Please try again.",
  };
}

export function isRateLimitError(error: ParsedError): boolean {
  return error.type === "rate_limit";
}

export function shouldShowUpgrade(error: ParsedError): boolean {
  return error.type === "rate_limit";
}

export function getRetryDelay(errorType: ParsedError["type"]): number {
  switch (errorType) {
    case "rate_limit":
      return 60000; // 1 minute for rate limits
    case "network_error":
      return 5000; // 5 seconds for network issues
    case "server_error":
      return 10000; // 10 seconds for server errors
    default:
      return 3000; // 3 seconds default
  }
}