import { BaseModal } from "./BaseModal";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: "destructive" | "default";
  children?: React.ReactNode;
}

/**
 * Reusable confirmation modal for destructive or important actions
 */
export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  loading = false,
  variant = "default",
  children,
}: ConfirmationModalProps) {
  const { t } = useTranslation();
  const handleConfirm = async () => {
    await onConfirm();
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={loading}
      >
        {cancelText || t("common.cancel")}
      </Button>
      <Button
        type="button"
        variant={variant === "destructive" ? "destructive" : "default"}
        onClick={handleConfirm}
        disabled={loading}
      >
        <ButtonLoading isLoading={loading}>
          {confirmText || t("common.confirm")}
        </ButtonLoading>
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      loading={loading}
      maxWidth="sm"
    >
      {variant === "destructive" && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">{t("common.actionCannotBeUndone")}</div>
              {children}
            </div>
          </AlertDescription>
        </Alert>
      )}
      {variant === "default" && children}
    </BaseModal>
  );
}