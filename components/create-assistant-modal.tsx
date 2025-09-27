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
      // Generic error for unexpected issues
      setServerError({
        message: error instanceof Error ? error.message : "Failed to create assistant",
      });
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

  // Helper functions for URL suggestions
  const isSpecificPage = (url: string): boolean => {
    return /\/(home|getting-started|intro|guide|learn|start|welcome)$/i.test(url);
  };

  const getRootDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url.replace(/\/[^/]+$/, '');
    }
  };

  const shouldShowSuggestion = formData.docsUrl && isSpecificPage(formData.docsUrl);
  const suggestedUrl = shouldShowSuggestion ? getRootDomain(formData.docsUrl) : '';

  // Check if user can create assistants (not over question limit)
  const canCreateAssistant = userPlan === "pro" || (questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && !serverError);

  const handleClose = (open: boolean) => {
    if (!open) {
      setServerError(null);
      setFormData({ name: "", docsUrl: "", description: "" });
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
                onChange={(e) => handleInputChange("docsUrl", e.target.value)}
                disabled={isLoading || !canCreateAssistant}
                required
              />
              <p className="text-xs text-muted-foreground">
                The starting URL where we'll crawl your documentation
              </p>

              {shouldShowSuggestion && (
                <Alert className="mt-2">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-xs">
                      {userPlan === "free"
                        ? "💡 Free User: This specific URL is perfect! It will help you make the best use of your 30 pages."
                        : "💡 For better crawling, try the root domain instead"
                      }
                    </span>
                    {userPlan !== "free" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-6 text-xs"
                        onClick={() => handleInputChange("docsUrl", suggestedUrl)}
                      >
                        Use {new URL(suggestedUrl).host}
                      </Button>
                    )}
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
                isLoading || !formData.name.trim() || !formData.docsUrl.trim() || !canCreateAssistant
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