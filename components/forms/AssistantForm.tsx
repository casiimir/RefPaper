import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertCircle } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import { useFormValidation, FormValidationUtils } from "./FormValidation";
import { FormErrorDisplay, ValidationErrorDisplay } from "./FormErrorDisplay";

export interface AssistantFormData {
  name: string;
  docsUrl: string;
  description: string;
}

interface AssistantFormProps {
  formData: AssistantFormData;
  onFormDataChange: (data: AssistantFormData) => void;
  userPlan: "free" | "pro";
  questionsThisMonth: number;
  disabled?: boolean;
}

/**
 * Reusable form component for assistant creation/editing
 */
export function AssistantForm({
  formData,
  onFormDataChange,
  userPlan,
  questionsThisMonth,
  disabled = false,
}: AssistantFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { urlValidation, validateUrl, isValidating } = useFormValidation({
    validateOnChange: true,
    debounceMs: 500,
  });

  const handleFieldChange = (field: keyof AssistantFormData, value: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }

    onFormDataChange({
      ...formData,
      [field]: value,
    });

    // Validate URL field
    if (field === "docsUrl") {
      validateUrl(value);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    const nameError = FormValidationUtils.validateRequired(formData.name, "Assistant name");
    if (nameError) errors.name = nameError;

    const urlError = FormValidationUtils.validateRequired(formData.docsUrl, "Documentation URL");
    if (urlError) errors.docsUrl = urlError;

    // Length validation
    const nameLengthError = FormValidationUtils.validateLength(formData.name, 2, 50, "Assistant name");
    if (nameLengthError) errors.name = nameLengthError;

    const descLengthError = FormValidationUtils.validateLength(
      formData.description,
      0,
      200,
      "Description"
    );
    if (descLengthError) errors.description = descLengthError;

    // URL format validation
    if (formData.docsUrl && !urlValidation?.isValid) {
      const formatError = FormValidationUtils.validateUrlFormat(formData.docsUrl);
      if (formatError) errors.docsUrl = formatError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canCreateAssistant = userPlan === "pro" || questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH;

  return (
    <div className="space-y-4">
      {/* Free Plan Limitations */}
      {userPlan === "free" && questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Free Plan - Limitations:</div>
              <ul className="text-xs space-y-1 ml-4">
                <li>• <strong>Specific subpages recommended:</strong> e.g. https://docs.convex.dev/functions instead of https://docs.convex.dev/</li>
                <li>• <strong>30 pages limit:</strong> If you enter complete URLs, we&apos;ll only crawl the first 30 pages</li>
                <li>• <strong>Limited depth:</strong> Only 3 levels of subpages</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Assistant Name */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            placeholder="My Documentation Assistant"
            value={formData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            disabled={disabled || !canCreateAssistant}
            required
          />
          <ValidationErrorDisplay error={fieldErrors.name} />
        </div>
      </div>

      {/* Documentation URL */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="docsUrl" className="text-right">
          Docs URL
        </Label>
        <div className="col-span-3">
          <Input
            id="docsUrl"
            type="url"
            placeholder="https://docs.example.com"
            value={formData.docsUrl}
            onChange={(e) => handleFieldChange("docsUrl", e.target.value)}
            disabled={disabled || !canCreateAssistant}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            The starting URL where we&apos;ll crawl your documentation
          </p>
          <ValidationErrorDisplay error={fieldErrors.docsUrl} />

          {/* URL Validation Errors */}
          {urlValidation?.error && (
            <FormErrorDisplay
              error={{ message: urlValidation.error, type: "error" }}
              className="mt-2"
            />
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          Description
        </Label>
        <div className="col-span-3">
          <Textarea
            id="description"
            placeholder="Brief description of what this assistant helps with..."
            value={formData.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            disabled={disabled || !canCreateAssistant}
            rows={3}
          />
          <ValidationErrorDisplay error={fieldErrors.description} />
        </div>
      </div>
    </div>
  );
}