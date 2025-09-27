import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
    />
  );
}

interface CenteredLoadingProps {
  message?: string;
  className?: string;
}

export function CenteredLoading({ message, className }: CenteredLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-20", className)}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ isLoading, children, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <LoadingSpinner size="sm" className="mr-2" />
        {loadingText || children}
      </>
    );
  }

  return <>{children}</>;
}

interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ title = "Loading...", description }: PageLoadingProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <CenteredLoading />
      <div className="text-center mt-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}