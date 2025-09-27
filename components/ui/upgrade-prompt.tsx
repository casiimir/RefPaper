"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Crown } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  currentUsage?: {
    used: number;
    limit: number;
  };
  onUpgrade?: () => void;
  className?: string;
}

export function UpgradePrompt({
  title,
  description,
  feature,
  currentUsage,
  onUpgrade,
  className = "",
}: UpgradePromptProps) {
  const { t } = useTranslation();
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default behavior: open billing page
      window.open("/pricing", "_blank");
    }
  };

  return (
    <Alert
      className={`border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 ${className}`}
    >
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="space-y-2">
          <p className="font-medium">{title}</p>
          <p className="text-sm">{description}</p>
          <div className="flex items-center gap-2 pt-2">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4 mr-1" />
              {t("upgrade.toPro")}
            </Button>
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {t("upgrade.getUnlimited", { feature })}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
