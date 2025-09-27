import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";

export interface FormError {
  message: string;
  type?: "error" | "warning" | "info";
  questionsUsed?: number;
  limit?: number;
}

interface FormErrorDisplayProps {
  error: FormError | null;
  className?: string;
}

/**
 * Standardized error display component for forms
 */
export function FormErrorDisplay({ error, className }: FormErrorDisplayProps) {
  if (!error) return null;

  const variant = error.type === "warning" ? "default" : "destructive";
  const Icon = error.type === "warning" ? AlertTriangle : AlertCircle;

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="text-xs">
        {error.message}
        {error.questionsUsed && error.limit && (
          <div className="mt-1 text-xs text-muted-foreground">
            Usage: {error.questionsUsed}/{error.limit} questions this month
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface ValidationErrorDisplayProps {
  error: string | null;
  className?: string;
}

/**
 * Simple validation error display for inline form validation
 */
export function ValidationErrorDisplay({ error, className }: ValidationErrorDisplayProps) {
  if (!error) return null;

  return (
    <p className={`text-xs text-destructive mt-1 ${className || ""}`}>
      {error}
    </p>
  );
}

interface ServerErrorDisplayProps {
  error: FormError | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Server error display with optional retry functionality
 */
export function ServerErrorDisplay({
  error,
  onRetry,
  className
}: ServerErrorDisplayProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="text-xs">{error.message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs underline hover:no-underline ml-2"
            >
              Try again
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}