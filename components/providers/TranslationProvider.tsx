"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Dictionary, getTranslation, getDictionary, getStoredLocale, setStoredLocale, type Locale } from '@/lib/i18n';

interface TranslationContextType {
  dictionary: Dictionary;
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLocale: (newLocale: Locale) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

interface TranslationProviderProps {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}

export function TranslationProvider({
  children,
  dictionary: initialDictionary,
  locale: initialLocale
}: TranslationProviderProps) {
  const [dictionary, setDictionary] = useState<Dictionary>(initialDictionary);
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // Initialize with stored locale on client
  useEffect(() => {
    const storedLocale = getStoredLocale();
    if (storedLocale !== initialLocale) {
      changeLocale(storedLocale);
    }
  }, [initialLocale]);

  const changeLocale = async (newLocale: Locale) => {
    try {
      const newDictionary = await getDictionary(newLocale);
      setDictionary(newDictionary);
      setLocale(newLocale);
      setStoredLocale(newLocale);
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(dictionary, key, params);
  };

  return (
    <TranslationContext.Provider value={{ dictionary, locale, t, changeLocale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }

  return context;
}