"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { Assistant } from "@/types/assistant";

interface AssistantSearchProps {
  assistants: Assistant[];
  children: (filteredAssistants: Assistant[]) => React.ReactNode;
}

export function AssistantSearch({ assistants, children }: AssistantSearchProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssistants = useMemo(() => {
    if (!assistants || !searchQuery.trim()) return assistants;

    const query = searchQuery.toLowerCase().trim();
    return assistants.filter((assistant) => {
      const matchesName = assistant.name.toLowerCase().includes(query);
      const matchesDescription = assistant.description?.toLowerCase().includes(query) || false;
      const matchesUrl = assistant.docsUrl.toLowerCase().includes(query);
      const matchesDomain = new URL(assistant.docsUrl).hostname.toLowerCase().includes(query);

      return matchesName || matchesDescription || matchesUrl || matchesDomain;
    });
  }, [assistants, searchQuery]);

  return (
    <>
      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <Search className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <Input
            type="text"
            placeholder={t("chat.searchAssistants")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 h-9 text-sm bg-background/50 backdrop-blur-sm border focus:border-primary/30 transition-all duration-200"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-1 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-6 w-6 p-0 hover:bg-muted/50 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredAssistants.length === 0
                ? t("chat.noResults")
                : t("chat.searchResults", { count: filteredAssistants.length })}
            </p>
            {filteredAssistants.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-5 text-xs px-2"
              >
                {t("chat.clearSearch")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {children(filteredAssistants)}
    </>
  );
}