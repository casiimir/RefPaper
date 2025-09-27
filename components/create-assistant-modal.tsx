"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { PLAN_LIMITS } from "@/lib/constants";
import { ButtonLoading } from "@/components/ui/loading";
import { validateDomain, ValidationResult } from "@/lib/domain-validator";

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
  const [serverError, setServerError] = useState<{
    message: string;
    type?: string;
    questionsUsed?: number;
    limit?: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    docsUrl: "",
    description: "",
  });
  const [urlValidation, setUrlValidation] = useState<ValidationResult | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.docsUrl.trim()) {
      return;
    }

    setIsLoading(true);
    setServerError(null); // Clear any previous error

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

        // Handle specific error types from API
        if (response.status === 403 && errorData.upgradeRequired) {
          setServerError({
            message: errorData.error,
            type: errorData.type,
            questionsUsed: errorData.questionsUsed,
            limit: errorData.limit,
          });
          return;
        }

        throw new Error(errorData.error || "Failed to create assistant");
      }

      await response.json();

      // Close modal and reset form
      onOpenChange(false);
      setFormData({ name: "", docsUrl: "", description: "" });
      setServerError(null);

      // Refresh the page to show new assistant
      router.refresh();
    } catch (error) {
      console.error("Error creating assistant:", error);

      // Check for specific error types
      const errorMessage = error instanceof Error ? error.message : "Failed to create assistant";

      if (errorMessage.includes("DOCUMENTATION_TOO_LARGE")) {
        setServerError({
          message: errorMessage.replace("DOCUMENTATION_TOO_LARGE: ", ""),
          type: "documentation_size",
        });
      } else {
        // Generic error for unexpected issues
        setServerError({
          message: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle URL change with validation
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, docsUrl: url }));

    if (url.trim()) {
      const validation = validateDomain(url);
      setUrlValidation(validation);
    } else {
      setUrlValidation(null);
    }
  };


  // Check if user can create assistants (not over question limit)
  const canCreateAssistant = userPlan === "pro" || (questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && !serverError);

  const handleClose = (open: boolean) => {
    if (!open) {
      setServerError(null);
      setFormData({ name: "", docsUrl: "", description: "" });
      setUrlValidation(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assistant</DialogTitle>
          <DialogDescription>
            Transform documentation into an AI assistant that can answer questions
            about your docs.
          </DialogDescription>
        </DialogHeader>

        {/* Server error from API (takes priority) */}
        {serverError && serverError.type === "question_limit" && (
          <UpgradePrompt
            title="Monthly question limit reached!"
            description={serverError.message}
            feature="questions"
            currentUsage={{
              used: serverError.questionsUsed || questionsThisMonth,
              limit: serverError.limit || PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
            }}
            className="mb-4"
          />
        )}

        {/* Assistant limit error */}
        {serverError && serverError.type === "assistant_limit" && (
          <UpgradePrompt
            title="Assistant limit reached!"
            description={serverError.message}
            feature="assistants"
            className="mb-4"
          />
        )}

        {/* Documentation too large error */}
        {serverError && serverError.type === "documentation_size" && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 mb-4">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="space-y-2">
                <div className="font-medium">📚 Documentation too extensive</div>
                <div className="text-sm">
                  {serverError.message}
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-medium">💡 Try these approaches:</div>
                  <ul className="ml-4 space-y-1">
                    <li>• Use specific sections like <code>/getting-started</code> or <code>/tutorials</code></li>
                    <li>• Target API documentation like <code>/api/reference</code></li>
                    <li>• Focus on individual guides instead of the entire site</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Generic server error */}
        {serverError && !serverError.type && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {serverError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Frontend preventive check (when no server error) */}
        {!serverError && userPlan === "free" && questionsThisMonth >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && (
          <UpgradePrompt
            title="Monthly question limit reached!"
            description="You need to upgrade to Pro to create new assistants."
            feature="questions"
            currentUsage={{
              used: questionsThisMonth,
              limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
            }}
            className="mb-4"
          />
        )}

        {userPlan === "free" && questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && (
          <Alert className="mb-4">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Free Plan - Limitations:</div>
                <ul className="text-xs space-y-1 ml-4">
                  <li>• <strong>Specific subpages recommended:</strong> e.g. https://docs.convex.dev/functions instead of https://docs.convex.dev/</li>
                  <li>• <strong>30 pages limit:</strong> If you enter complete URLs, we'll only crawl the first 30 pages</li>
                  <li>• <strong>Limited depth:</strong> Only 3 levels of subpages</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Assistant Name *</Label>
              <Input
                id="name"
                placeholder="e.g., React Docs Assistant"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isLoading || !canCreateAssistant}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="docsUrl">Documentation URL *</Label>
              <Input
                id="docsUrl"
                type="url"
                placeholder="https://docs.example.com"
                value={formData.docsUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={isLoading || !canCreateAssistant}
                required
              />
              <p className="text-xs text-muted-foreground">
                The starting URL where we'll crawl your documentation
              </p>

              {/* URL Validation Errors */}
              {urlValidation?.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {urlValidation.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* URL Validation Warnings */}
              {urlValidation?.warning && !urlValidation.error && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    ⚠️ {urlValidation.warning}
                  </AlertDescription>
                </Alert>
              )}

            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this assistant helps with..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={isLoading || !canCreateAssistant}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.name.trim() ||
                !formData.docsUrl.trim() ||
                !canCreateAssistant ||
                (urlValidation?.isValid === false)
              }
            >
              <ButtonLoading isLoading={isLoading} loadingText="Creating...">
                Create Assistant
              </ButtonLoading>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}