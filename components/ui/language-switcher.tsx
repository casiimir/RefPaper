"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { languages, type Locale } from "@/lib/i18n";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale: currentLocale, changeLocale } = useTranslation();

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale !== currentLocale) {
      await changeLocale(newLocale);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <Globe className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-3 w-40 bg-background border-b border-x rounded-b-md shadow-lg z-[999]">
          <div className="py-0">
            {Object.entries(languages).map(([locale, language]) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale as Locale)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2",
                  currentLocale === locale && "bg-accent text-accent-foreground"
                )}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
