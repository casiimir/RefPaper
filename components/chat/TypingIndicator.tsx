"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/TranslationProvider";

export function TypingIndicator() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
        <Bot className="h-4 w-4" />
      </div>

      {/* Typing animation */}
      <div className="flex-1 space-y-2">
        <div className="rounded-lg px-4 py-3 bg-muted text-foreground max-w-[80%]">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              {t("chat.consultingDocs")}
            </span>
            <div className="flex space-x-1">
              <div
                className={cn(
                  "w-1 h-1 bg-muted-foreground rounded-full animate-bounce",
                  "[animation-delay:-0.3s]"
                )}
              />
              <div
                className={cn(
                  "w-1 h-1 bg-muted-foreground rounded-full animate-bounce",
                  "[animation-delay:-0.15s]"
                )}
              />
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
