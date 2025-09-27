"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/BaseModal";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { PLAN_LIMITS } from "@/lib/constants";
import { AssistantForm, AssistantFormData } from "@/components/forms/AssistantForm";
import { ServerErrorDisplay, FormError } from "@/components/forms/FormErrorDisplay";

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
          message: errorData.error || "Failed to create assistant",
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
        message: "Network error. Please check your connection and try again.",
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
      title="Create New Assistant"
      description="Create an AI assistant trained on your documentation"
      onSubmit={handleSubmit}
      submitText="Create Assistant"
      submitDisabled={!canCreateAssistant || !formData.name.trim() || !formData.docsUrl.trim()}
      loading={isLoading}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Upgrade prompt for users at limit */}
        {!canCreateAssistant && (
          <UpgradePrompt
            title="Upgrade Required"
            description="You've reached your plan limit. Upgrade to Pro for more assistants and unlimited questions."
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