import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";

export interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const maxWidthClasses = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[800px]",
};

/**
 * Base modal component with consistent styling and behavior
 */
export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  loading = false,
}: BaseModalProps) {
  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={maxWidthClasses[maxWidth]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children}

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export interface FormModalProps extends Omit<BaseModalProps, 'footer' | 'children'> {
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  submitDisabled?: boolean;
  children: React.ReactNode;
}

/**
 * Modal specifically designed for forms with submit/cancel actions
 */
export function FormModal({
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  submitDisabled = false,
  loading = false,
  onOpenChange,
  children,
  ...baseProps
}: FormModalProps) {
  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        disabled={submitDisabled || loading}
        form="modal-form"
      >
        <ButtonLoading isLoading={loading}>
          {submitText}
        </ButtonLoading>
      </Button>
    </>
  );

  return (
    <BaseModal {...baseProps} onOpenChange={onOpenChange} footer={footer} loading={loading}>
      <form id="modal-form" onSubmit={onSubmit}>
        {children}
      </form>
    </BaseModal>
  );
}