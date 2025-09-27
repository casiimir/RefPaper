"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/BaseModal";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { PLAN_LIMITS } from "@/lib/constants";
import { AssistantForm, AssistantFormData } from "@/components/forms/AssistantForm";
import { ServerErrorDisplay, FormError } from "@/components/forms/FormErrorDisplay";
import { useTranslation } from "@/components/providers/TranslationProvider";

interface CreateAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPlan?: "free" | "pro";
  questionsThisMonth?: number;
}

export function CreateAssistantModal({
  open,
  onOpenChange,
  userPlan = "free",
  questionsThisMonth = 0,
}: CreateAssistantModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<FormError | null>(null);
  const [formData, setFormData] = useState<AssistantFormData>({
    name: "",
    docsUrl: "",
    description: "",
  });

  const canCreateAssistant = userPlan === "pro" || questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.docsUrl.trim()) {
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/assistant/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError({
          message: errorData.error || t("errors.failedToCreate"),
          type: errorData.type || "error",
          questionsUsed: errorData.questionsUsed,
          limit: errorData.limit,
        });
        return;
      }

      await response.json();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create assistant:", error);
      setServerError({
        message: t("errors.networkError"),
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: "", docsUrl: "", description: "" });
      setServerError(null);
      onOpenChange(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title={t("assistant.createNew")}
      description={t("assistant.createDescription")}
      onSubmit={handleSubmit}
      submitText={t("assistant.createAssistant")}
      submitDisabled={!canCreateAssistant || !formData.name.trim() || !formData.docsUrl.trim()}
      loading={isLoading}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Upgrade prompt for users at limit */}
        {!canCreateAssistant && (
          <UpgradePrompt
            title={t("upgrade.required")}
            description={t("upgrade.description")}
            feature="creating assistants"
            currentUsage={{
              used: questionsThisMonth || 0,
              limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
            }}
          />
        )}

        {/* Server error display */}
        <ServerErrorDisplay error={serverError} />

        {/* Assistant form */}
        <AssistantForm
          formData={formData}
          onFormDataChange={setFormData}
          userPlan={userPlan}
          questionsThisMonth={questionsThisMonth}
          disabled={isLoading}
        />
      </div>
    </FormModal>
  );
}