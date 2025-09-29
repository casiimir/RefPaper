import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, AlertCircle, HelpCircle } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import { useFormValidation, FormValidationUtils } from "./FormValidation";
import { FormErrorDisplay, ValidationErrorDisplay } from "./FormErrorDisplay";
import { useTranslation } from "@/components/providers/TranslationProvider";

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
  const { t } = useTranslation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { urlValidation, validateUrl, isValidating } = useFormValidation({
    validateOnChange: true,
    debounceMs: 500,
  });

  const handleFieldChange = (field: keyof AssistantFormData, value: string) => {
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
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
    const nameError = FormValidationUtils.validateRequired(
      formData.name,
      "Assistant name"
    );
    if (nameError) errors.name = nameError;

    const urlError = FormValidationUtils.validateRequired(
      formData.docsUrl,
      "Documentation URL"
    );
    if (urlError) errors.docsUrl = urlError;

    // Length validation
    const nameLengthError = FormValidationUtils.validateLength(
      formData.name,
      2,
      50,
      "Assistant name"
    );
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
      const formatError = FormValidationUtils.validateUrlFormat(
        formData.docsUrl
      );
      if (formatError) errors.docsUrl = formatError;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canCreateAssistant =
    userPlan === "pro" ||
    questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH;

  return (
    <div className="space-y-4">
      {/* Information Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="crawling-info" className="border-none">
          <AccordionTrigger className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground" tabIndex={-1}>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              {t("assistant.form.infoTitle")}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible">
            {/* Crawling Explanation */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <div className="font-medium mb-1">{t("assistant.form.crawlExplanation.title")}</div>
                  <div className="space-y-1">
                    <div>• {t("assistant.form.crawlExplanation.step1")}</div>
                    <div>• {t("assistant.form.crawlExplanation.step2")}</div>
                    <div>• {t("assistant.form.crawlExplanation.step3")}</div>
                    <div className="font-medium mt-2">• {t("assistant.form.crawlExplanation.result")}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Free Plan Limitations */}
            {userPlan === "free" &&
              questionsThisMonth < PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        {t("assistant.freePlanLimits.title")}
                      </div>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>
                          • <strong>Specific subpages recommended:</strong>{" "}
                          {t("assistant.freePlanLimits.specificSubpages")}
                        </li>
                        <li>
                          • <strong>30 pages limit:</strong>{" "}
                          {t("assistant.freePlanLimits.pageLimit")}
                        </li>
                        <li>
                          • <strong>Limited depth:</strong>{" "}
                          {t("assistant.freePlanLimits.depthLimit")}
                        </li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Assistant Name */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          {t("assistant.form.name")}
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            placeholder={t("assistant.form.namePlaceholder")}
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
          {t("assistant.form.docsUrl")}
        </Label>
        <div className="col-span-3">
          <Input
            id="docsUrl"
            type="url"
            placeholder={t("assistant.form.urlPlaceholder")}
            value={formData.docsUrl}
            onChange={(e) => handleFieldChange("docsUrl", e.target.value)}
            disabled={disabled || !canCreateAssistant}
            required
          />
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
          {t("assistant.form.description")}
        </Label>
        <div className="col-span-3">
          <Textarea
            id="description"
            placeholder={t("assistant.form.descriptionPlaceholder")}
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
