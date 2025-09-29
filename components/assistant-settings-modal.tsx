"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { BaseModal } from "@/components/modals/BaseModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { ErrorAlert } from "@/components/ui/error-alert";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Assistant } from "@/types/assistant";
import { useTranslation } from "@/components/providers/TranslationProvider";

interface AssistantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: Assistant | null;
}

export function AssistantSettingsModal({
  open,
  onOpenChange,
  assistant,
}: AssistantSettingsModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: assistant?.name || "",
    description: assistant?.description || "",
  });

  const updateAssistant = useMutation(api.assistants.updateAssistant);
  const deleteAssistant = useMutation(api.assistants.deleteAssistantRecord);

  // Update form data when assistant changes
  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name,
        description: assistant.description || "",
      });
    }
  }, [assistant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistant || !formData.name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateAssistant({
        id: assistant._id as Id<"assistants">,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to update assistant:", err);
      setError("Failed to update assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assistant) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAssistant({
        id: assistant._id as Id<"assistants">,
      });
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete assistant:", err);
      setError("Failed to delete assistant. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isDeleting) {
      setShowDeleteConfirm(false);
      setError(null);
      onOpenChange(false);
    }
  };

  const settingsFooter = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isLoading}
        className="mr-auto"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {t("common.delete")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isLoading}
      >
        {t("common.cancel")}
      </Button>
      <Button
        type="submit"
        disabled={!formData.name.trim() || isLoading}
        form="settings-form"
      >
        <ButtonLoading isLoading={isLoading}>
          {t("assistant.saveChanges")}
        </ButtonLoading>
      </Button>
    </>
  );

  return (
    <>
      <BaseModal
        open={open && !showDeleteConfirm}
        onOpenChange={handleClose}
        title={t("assistant.settings")}
        description={t("assistant.settingsDescription", {
          name: assistant?.name || "",
        })}
        footer={settingsFooter}
        loading={isLoading}
      >
        <div className="space-y-4">
          {/* Show error status if assistant failed */}
          {assistant?.status === "error" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{t("assistant.creationError")}</div>
                  {assistant.errorMessage && (
                    <div className="text-sm">
                      <strong>{t("assistant.errorDetails")}:</strong> {assistant.errorMessage}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {t("assistant.errorSuggestion")}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form id="settings-form" onSubmit={handleSave} className="space-y-4">
            {error && <ErrorAlert errorMessage={error} />}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {t("assistant.form.name")}
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              {t("assistant.form.description")}
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          </form>
        </div>
      </BaseModal>

      <ConfirmationModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("assistant.deleteAssistant")}
        confirmText={t("assistant.deleteConfirmation")}
        onConfirm={handleDelete}
        loading={isDeleting}
        variant="destructive"
      >
        <div className="text-sm space-y-2">
          <div>{t("assistant.deleteWarning")}</div>
          <ul className="text-xs space-y-1 ml-4">
            <li>{t("assistant.deleteItem1")}</li>
            <li>{t("assistant.deleteItem2")}</li>
            <li>{t("assistant.deleteItem3")}</li>
          </ul>
          <div className="text-sm font-medium mt-3">
            {t("assistant.assistantName", { name: assistant?.name || "" })}
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}
