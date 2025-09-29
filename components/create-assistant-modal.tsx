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

  const performSubmit = async () => {
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

        // Determine the appropriate error message based on the error content
        let errorMessage = errorData.error || t("errors.failedToCreate");
        let errorType: "error" | "warning" | "info" | "network" | "timeout" | "server" | "limit" = "error";

        // Check for specific error patterns and provide better messages
        if (errorData.error) {
          const errorText = errorData.error.toLowerCase();

          if (errorText.includes("timeout") || errorText.includes("timed out")) {
            errorMessage = t("errors.crawlTimeout");
            errorType = "timeout";
          } else if (errorText.includes("network") || errorText.includes("connection")) {
            errorMessage = t("errors.networkError");
            errorType = "network";
          } else if (errorText.includes("server") || response.status >= 500) {
            errorMessage = t("errors.serverError");
            errorType = "server";
          } else if (errorText.includes("limit")) {
            // Keep the original limit message as it's already handled well
            errorMessage = errorData.error;
            errorType = "limit";
          } else if (errorText.includes("api key") || errorText.includes("pinecone") ||
                     errorText.includes("openai") || errorText.includes("authentication") ||
                     errorText.includes("unauthorized") || errorText.includes("forbidden") ||
                     errorText.includes("rate limit") || errorText.includes("quota") ||
                     errorText.includes("service unavailable") || errorText.includes("internal error")) {
            // Technical/system errors - show user-friendly message
            errorMessage = t("errors.systemError");
            errorType = "server";
          }
        }

        setServerError({
          message: errorMessage,
          type: errorType,
          questionsUsed: errorData.questionsUsed,
          limit: errorData.limit,
        });
        return;
      }

      await response.json();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create assistant:", error);

      // Determine the type of error and provide appropriate message
      let errorMessage = t("errors.networkError");
      let errorType: "error" | "warning" | "info" | "network" | "timeout" | "server" | "limit" = "error";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        // Network/fetch error
        errorMessage = t("errors.networkError");
        errorType = "network";
      } else if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        // Check if the error message indicates a timeout
        if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
          errorMessage = t("errors.crawlTimeout");
          errorType = "timeout";
        } else if (errorMsg.includes("api key") || errorMsg.includes("pinecone") ||
                   errorMsg.includes("openai") || errorMsg.includes("authentication") ||
                   errorMsg.includes("service") || errorMsg.includes("internal")) {
          // Technical errors in client-side
          errorMessage = t("errors.systemError");
          errorType = "server";
        } else {
          errorMessage = t("errors.unknownError");
          errorType = "error";
        }
      }

      setServerError({
        message: errorMessage,
        type: errorType,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSubmit();
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
        <ServerErrorDisplay
          error={serverError}
          onRetry={() => {
            setServerError(null);
            // Auto retry for certain error types
            if (serverError?.type === "network" || serverError?.type === "server") {
              performSubmit();
            }
          }}
        />

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