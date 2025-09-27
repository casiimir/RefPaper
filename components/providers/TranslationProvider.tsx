"use client";

import { createContext, useContext, ReactNode } from 'react';
import { Dictionary, getTranslation } from '@/lib/i18n';

interface TranslationContextType {
  dictionary: Dictionary;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

interface TranslationProviderProps {
  children: ReactNode;
  dictionary: Dictionary;
  locale: string;
}

export function TranslationProvider({
  children,
  dictionary,
  locale
}: TranslationProviderProps) {
  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(dictionary, key, params);
  };

  return (
    <TranslationContext.Provider value={{ dictionary, locale, t }}>
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