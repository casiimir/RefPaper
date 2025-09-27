// Error classification and processing utilities

import { ERROR_TYPES, ERROR_PATTERNS, ERROR_CONFIGS, ErrorType, ErrorDetails } from './errors';

/**
 * Classifies an error message into a specific error type
 */
export function classifyError(errorMessage: string): ErrorType {
  if (!errorMessage) {
    return ERROR_TYPES.GENERIC;
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Check each error type for pattern matches
  for (const [errorType, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()))) {
      return errorType as ErrorType;
    }
  }

  return ERROR_TYPES.GENERIC;
}

/**
 * Gets detailed error information for a specific error type
 */
export function getErrorDetails(errorType: ErrorType): ErrorDetails {
  return ERROR_CONFIGS[errorType] || ERROR_CONFIGS[ERROR_TYPES.GENERIC];
}

/**
 * Processes an error message and returns classification and details
 */
export function processError(errorMessage: string): {
  type: ErrorType;
  details: ErrorDetails;
  originalMessage: string;
} {
  const type = classifyError(errorMessage);
  const details = getErrorDetails(type);

  return {
    type,
    details,
    originalMessage: errorMessage
  };
}

/**
 * Checks if an error message matches a specific error type
 */
export function isErrorType(errorMessage: string, errorType: ErrorType): boolean {
  return classifyError(errorMessage) === errorType;
}

/**
 * Gets user-friendly error message from raw error
 */
export function formatErrorMessage(errorMessage: string): string {
  const { details } = processError(errorMessage);
  return details.description;
}

export default {
  classifyError,
  getErrorDetails,
  processError,
  isErrorType,
  formatErrorMessage
};