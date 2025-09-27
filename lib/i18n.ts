import { notFound } from 'next/navigation';

// Define supported locales
export const locales = ['en', 'it'] as const;
export type Locale = typeof locales[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale validation
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from pathname or default
export function getLocale(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }

  return defaultLocale;
}

// Dictionary loader - dynamic imports for better performance
const dictionaries = {
  en: () => import('@/messages/en.json').then((module) => module.default),
  it: () => import('@/messages/it.json').then((module) => module.default),
} as const;

export async function getDictionary(locale: Locale) {
  if (!isValidLocale(locale)) {
    notFound();
  }

  try {
    return await dictionaries[locale]();
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return await dictionaries[defaultLocale]();
    }
    throw error;
  }
}

// Type-safe translation function
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

// Helper function to get nested translation values
export function getTranslation(
  dict: Dictionary,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const keys = key.split('.');
  let value: any = dict;

  for (const k of keys) {
    value = value?.[k];
  }

  if (typeof value !== 'string') {
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key itself as fallback
  }

  // Simple parameter interpolation
  return Object.entries(params).reduce(
    (text, [param, val]) => text.replace(`{${param}}`, String(val)),
    value
  );
}

// Language configuration
export const languages = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr' as const,
  },
  it: {
    name: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr' as const,
  },
} as const;