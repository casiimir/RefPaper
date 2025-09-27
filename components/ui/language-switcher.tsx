"use client";

import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { languages, type Locale } from '@/lib/i18n';
import { useRouter, usePathname } from 'next/navigation';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export function LanguageSwitcher({ currentLocale, className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = () => {
    // Simple toggle between en and it for now
    const newLocale = currentLocale === 'en' ? 'it' : 'en';

    // For now, just reload with the new locale
    // In production, you'd implement proper URL structure
    window.location.reload();
  };

  const currentLanguage = languages[currentLocale];

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleLocaleChange}
      title={`Switch to ${currentLocale === 'en' ? 'Italiano' : 'English'}`}
    >
      <Globe className="h-4 w-4 mr-2" />
      <span className="text-sm">{currentLanguage.flag}</span>
      <span className="ml-1 text-xs">{currentLanguage.name}</span>
    </Button>
  );
}