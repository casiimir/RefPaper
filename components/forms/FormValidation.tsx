import { useState, useCallback } from "react";
import { validateDomain, ValidationResult } from "@/lib/domain-validator";

export interface UseFormValidationProps {
  validateOnChange?: boolean;
  debounceMs?: number;
}

export interface FormValidationHook {
  urlValidation: ValidationResult | null;
  validateUrl: (url: string) => Promise<ValidationResult>;
  clearValidation: () => void;
  isValidating: boolean;
}

/**
 * Custom hook for form validation with URL domain checking
 */
export function useFormValidation({}: UseFormValidationProps = {}): FormValidationHook {
  const [urlValidation, setUrlValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateUrl = useCallback(async (url: string): Promise<ValidationResult> => {
    if (!url.trim()) {
      const emptyResult: ValidationResult = { isValid: false, error: undefined };
      setUrlValidation(emptyResult);
      return emptyResult;
    }

    setIsValidating(true);

    try {
      const result = await validateDomain(url);
      setUrlValidation(result);
      return result;
    } catch {
      const errorResult: ValidationResult = {
        isValid: false,
        error: "Validation failed. Please check the URL format.",
      };
      setUrlValidation(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);



  const clearValidation = useCallback(() => {
    setUrlValidation(null);
    setIsValidating(false);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  }, [debounceTimeout]);

  return {
    urlValidation,
    validateUrl,
    clearValidation,
    isValidating,
  };
}

/**
 * Common form validation utilities
 */
export const FormValidationUtils = {
  /**
   * Validates required fields
   */
  validateRequired: (value: string, fieldName: string): string | null => {
    return value.trim() ? null : `${fieldName} is required`;
  },

  /**
   * Validates URL format
   */
  validateUrlFormat: (url: string): string | null => {
    try {
      new URL(url);
      return null;
    } catch {
      return "Please enter a valid URL";
    }
  },

  /**
   * Validates string length
   */
  validateLength: (
    value: string,
    min: number,
    max: number,
    fieldName: string
  ): string | null => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },
};