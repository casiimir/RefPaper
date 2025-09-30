// Centralized error handling system

export const ERROR_TYPES = {
  DOCUMENTATION_TOO_LARGE: "documentation_too_large",
  CRAWL_TIMEOUT: "crawl_timeout",
  ASSISTANT_LIMIT: "assistant_limit",
  QUESTION_LIMIT: "question_limit",
  INVALID_URL: "invalid_url",
  GENERIC: "generic",
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

// Error categories for retry logic
export const ERROR_CATEGORIES = {
  PERMANENT: [
    ERROR_TYPES.DOCUMENTATION_TOO_LARGE,
    ERROR_TYPES.INVALID_URL,
    ERROR_TYPES.ASSISTANT_LIMIT,
    ERROR_TYPES.QUESTION_LIMIT,
  ],
  TEMPORARY: [
    ERROR_TYPES.CRAWL_TIMEOUT,
  ],
  RETRIABLE: [
    ERROR_TYPES.GENERIC,
  ],
} as const;

export interface ErrorDetails {
  variant: "destructive" | "default" | "secondary";
  icon: "alert-triangle" | "alert-circle" | "info";
}

// Patterns to match error messages to types
export const ERROR_PATTERNS: Record<ErrorType, string[]> = {
  [ERROR_TYPES.DOCUMENTATION_TOO_LARGE]: [
    "DOCUMENTATION_TOO_LARGE",
    "maximum context length",
    "token limit",
    "too large",
    "too complex",
    "exceeds",
    "structure exceeds",
  ],
  [ERROR_TYPES.CRAWL_TIMEOUT]: [
    "crawling timed out",
    "timeout",
    "too slow or unresponsive",
  ],
  [ERROR_TYPES.ASSISTANT_LIMIT]: ["assistant limit", "assistant_limit"],
  [ERROR_TYPES.QUESTION_LIMIT]: [
    "question limit",
    "question_limit",
    "monthly question limit",
  ],
  [ERROR_TYPES.INVALID_URL]: [
    "invalid url",
    "invalid_url",
    "Please provide a valid URL",
  ],
  [ERROR_TYPES.GENERIC]: [],
};

// Error styling configuration (text content is handled by i18n)
export const ERROR_CONFIGS: Record<ErrorType, ErrorDetails> = {
  [ERROR_TYPES.DOCUMENTATION_TOO_LARGE]: {
    variant: "destructive",
    icon: "alert-triangle",
  },
  [ERROR_TYPES.CRAWL_TIMEOUT]: {
    variant: "secondary",
    icon: "alert-triangle",
  },
  [ERROR_TYPES.ASSISTANT_LIMIT]: {
    variant: "destructive",
    icon: "alert-circle",
  },
  [ERROR_TYPES.QUESTION_LIMIT]: {
    variant: "destructive",
    icon: "alert-circle",
  },
  [ERROR_TYPES.INVALID_URL]: {
    variant: "destructive",
    icon: "alert-triangle",
  },
  [ERROR_TYPES.GENERIC]: {
    variant: "destructive",
    icon: "alert-circle",
  },
};

/**
 * Identifies the error type based on error message patterns
 */
export function identifyErrorType(errorMessage: string): ErrorType {
  const lowercaseMessage = errorMessage.toLowerCase();

  for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some(pattern => lowercaseMessage.includes(pattern.toLowerCase()))) {
      return errorType as ErrorType;
    }
  }

  return ERROR_TYPES.GENERIC;
}

/**
 * Determines if an error is permanent (should not be retried)
 */
export function isPermanentError(errorMessage: string): boolean {
  const errorType = identifyErrorType(errorMessage);
  return (ERROR_CATEGORIES.PERMANENT as readonly ErrorType[]).includes(errorType);
}

/**
 * Determines if an error is a rate limit error (special retry logic)
 */
export function isRateLimitError(errorMessage: string): boolean {
  const lowercaseMessage = errorMessage.toLowerCase();
  return lowercaseMessage.includes("rate limit exceeded") ||
         lowercaseMessage.includes("429") ||
         lowercaseMessage.includes("rate limit") ||
         lowercaseMessage.includes("too many requests");
}

const errorConstants = {
  ERROR_TYPES,
  ERROR_PATTERNS,
  ERROR_CONFIGS,
  ERROR_CATEGORIES,
};

export default errorConstants;
