"use client";

import { ScanSearch, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/TranslationProvider";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
  totalCount?: number;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  resultsCount = 0,
}: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full mb-8">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <ScanSearch className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <Input
          type="text"
          placeholder={t("dashboard.searchAssistants")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-12 h-12 text-md bg-background/50 backdrop-blur-sm border-2 focus:border-primary/30 transition-all duration-200 hover:border-muted/40"
        />
        {searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange("")}
              className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">
              {resultsCount === 0
                ? t("dashboard.noResults")
                : t("dashboard.searchResults", { count: resultsCount })}
            </p>
          </div>
          {resultsCount === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSearchChange("")}
              className="h-7 text-xs"
            >
              {t("dashboard.clearSearch")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
