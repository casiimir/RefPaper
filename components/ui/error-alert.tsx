"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { processError } from "@/lib/error-classifier";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/TranslationProvider";

interface ErrorAlertProps {
  errorMessage: string;
  className?: string;
  showSuggestions?: boolean;
}

export function ErrorAlert({
  errorMessage,
  className,
  showSuggestions = true
}: ErrorAlertProps) {
  const { t } = useTranslation();

  if (!errorMessage) {
    return null;
  }

  const { details } = processError(errorMessage);

  const getIcon = () => {
    switch (details.icon) {
      case 'alert-triangle':
        return <AlertTriangle className="h-4 w-4" />;
      case 'alert-circle':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getVariantClasses = () => {
    switch (details.variant) {
      case 'destructive':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 text-red-800 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400';
      case 'secondary':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 text-orange-800 dark:text-orange-200 [&>svg]:text-orange-600 dark:[&>svg]:text-orange-400';
      default:
        return '';
    }
  };

  return (
    <Alert
      variant={details.variant === 'secondary' ? 'default' : details.variant}
      className={cn(
        details.variant === 'secondary' && getVariantClasses(),
        className
      )}
    >
      {getIcon()}
      <AlertDescription>
        <div className="space-y-2">
          <div className="font-medium">
            📚 {details.title}
          </div>
          <div className="text-sm">
            {details.description}
          </div>

          {showSuggestions && details.suggestions && details.suggestions.length > 0 && (
            <div className="text-xs space-y-1 mt-3">
              <div className="font-medium">{t("ui.suggestions")}</div>
              <ul className="ml-4 space-y-1">
                {details.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    • {suggestion.includes('/') ? (
                      <>
                        {suggestion.split('/').map((part, i, arr) => (
                          <span key={i}>
                            {i > 0 && i < arr.length - 1 && part.trim() && (
                              <code>/{part.trim()}</code>
                            )}
                            {i === 0 && part.trim()}
                            {i === arr.length - 1 && part.trim() && !part.includes('code>') && part}
                          </span>
                        ))}
                      </>
                    ) : (
                      suggestion
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ErrorAlert;