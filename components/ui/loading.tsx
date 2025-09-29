import { Loader2 } from "lucide-react";

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({ isLoading, children, loadingText }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
        {loadingText || children}
      </>
    );
  }

  return <>{children}</>;
}

