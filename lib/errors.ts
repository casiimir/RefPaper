// Centralized error handling system

export const ERROR_TYPES = {
  DOCUMENTATION_TOO_LARGE: "documentation_too_large",
  ASSISTANT_LIMIT: "assistant_limit",
  QUESTION_LIMIT: "question_limit",
  INVALID_URL: "invalid_url",
  GENERIC: "generic",
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

export interface ErrorDetails {
  title: string;
  description: string;
  suggestions?: string[];
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

// Error details configuration
export const ERROR_CONFIGS: Record<ErrorType, ErrorDetails> = {
  [ERROR_TYPES.DOCUMENTATION_TOO_LARGE]: {
    title: "Documentation too extensive",
    description:
      "The document structure is too complex or contains very large pages.",
    suggestions: [
      "Try more specific subpages like /getting-started",
      "Use API documentation sections like /api/reference",
      "Focus on individual guides instead of the entire site",
    ],
    variant: "destructive",
    icon: "alert-triangle",
  },
  [ERROR_TYPES.ASSISTANT_LIMIT]: {
    title: "Assistant limit reached",
    description:
      "You have reached the maximum number of assistants for your plan.",
    suggestions: [
      "Upgrade to Pro for more assistants",
      "Delete unused assistants to free up space",
    ],
    variant: "destructive",
    icon: "alert-circle",
  },
  [ERROR_TYPES.QUESTION_LIMIT]: {
    title: "Monthly question limit reached",
    description: "You have used all your questions for this month.",
    suggestions: [
      "Upgrade to Pro for unlimited questions",
      "Wait until next month for the limit to reset",
    ],
    variant: "destructive",
    icon: "alert-circle",
  },
  [ERROR_TYPES.INVALID_URL]: {
    title: "Invalid URL",
    description: "The provided URL is not valid or accessible.",
    suggestions: [
      "Ensure the URL includes https://",
      "Check that the URL is publicly accessible",
      "Try a different documentation URL",
    ],
    variant: "destructive",
    icon: "alert-triangle",
  },
  [ERROR_TYPES.GENERIC]: {
    title: "Assistant creation failed",
    description: "An unexpected error occurred during assistant creation.",
    suggestions: [
      "Please try again",
      "Check your internet connection",
      "Contact support if the problem persists",
    ],
    variant: "destructive",
    icon: "alert-circle",
  },
};

export default {
  ERROR_TYPES,
  ERROR_PATTERNS,
  ERROR_CONFIGS,
};
